
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, StoredKey } from "../types";

// --- Helper: Construct the System Prompt ---
export const constructSystemPrompt = (
  original: string,
  modified: string,
  personaInstruction: string,
  question?: string
) => {
  const questionContext = question 
    ? `SPECIFIC QUESTION/GOAL: The user wants to know: "${question}".\nCompare which version better answers this question or achieves this goal.`
    : `TASK: Compare the quality of the two texts. Highlight improvements and potential regressions.`;

  return `
    ${personaInstruction}

    ${questionContext}

    Here are the texts to analyze:

    === ORIGINAL TEXT ===
    ${original}
    =====================

    === MODIFIED TEXT ===
    ${modified}
    =====================

    Please provide your analysis in Chinese (Markdown format).
    1. Summarize key changes.
    2. ${question ? "Directly answer the user's specific question about which version is better." : "Evaluate the overall improvement."}
    3. Provide a conclusion.
  `;
};

// --- PROVIDER IMPLEMENTATIONS ---

// 1. Google Gemini Provider
const callGemini = async (
  key: StoredKey,
  model: string,
  messages: ChatMessage[],
  systemContext?: string // For the first run
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: key.value });
  
  // Convert messages to Gemini format
  // We need to construct the history carefully.
  // If this is the very first call (systemContext exists), we prepend it.
  
  let sdkHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = [];
  let lastMessage = "";

  if (systemContext) {
     // First turn: System Context -> Model Response (if any history exists)
     // But if we are just starting, we send this as the message.
     if (messages.length === 0) {
       lastMessage = systemContext;
     } else {
        // Resume history
        // We must inject the system context as the first user message
        sdkHistory.push({ role: 'user', parts: [{ text: systemContext }] });
        
        // Add the rest of history except the very last user message (which we want to send now)
        // Actually, stateless call style: recreate history up to N-1, send N.
        // But for simplicity in this app, 'messages' contains EVERYTHING including the latest user message.
        
        // Let's separate history from the "new" message if possible, OR just use history + sendMessage('') 
        // But sendMessage('') is invalid.
        // Strategy: Create chat with history of [0...N-1], then sendMessage(N).
     }
  } else {
    // Follow up
    // Logic: We assume the first message in 'messages' was the system context result or we need to persist context?
    // Problem: Gemini Chat object is stateful, but here we are stateless.
    // We need to pass the FULL context every time if we are stateless.
    // But 'messages' in App.tsx doesn't store the big system prompt text, it stores the *model's response*.
    
    // FIX: In App.tsx, we must ensure we always pass the systemContext (original/modified text) to this function.
    // We will rebuild the history every time.
  }

  // Unified Stateless Logic for Gemini:
  // 1. Build full history including the "System Context" (Original/Modified texts) as the first user message.
  const fullHistory = [];
  
  // If we have a system prompt context (we should always have it for this app), that's the first User message.
  if (systemContext) {
    fullHistory.push({ role: 'user', parts: [{ text: systemContext }] });
  }

  // Append the visible chat history
  // We assume 'messages' contains [ModelResponse, UserFollowUp, ModelResponse...]
  // Wait, App.tsx 'messages' starts with the First Model Response.
  // So:
  // User (SystemContext) -> Model (messages[0]) -> User (messages[1]) -> ...
  
  // The last message in `messages` is the one we want to "respond" to? 
  // No, `messages` passed here usually includes the latest User message that needs a response.
  // OR, we can define `messages` as "History so far" and `newMessage` string. 
  // Let's stick to: `messages` is the History (including the latest user message). We send the whole chain.
  
  // However, Gemini SDK `chat.sendMessage` expects to *send* the last part.
  
  // Separate History (All except last) and Current Message (Last)
  const historyMsg = [...messages];
  const lastUserMsg = historyMsg.pop(); 

  if (!lastUserMsg || lastUserMsg.role !== 'user') {
     // Special case: First run. 
     if (systemContext && messages.length === 0) {
        const chat = ai.chats.create({ model });
        const result = await chat.sendMessage({ message: systemContext });
        return result.text || "";
     }
     throw new Error("Invalid message history state.");
  }

  // Convert intermediate history
  for (const msg of historyMsg) {
    fullHistory.push({
      role: msg.role,
      parts: [{ text: msg.text }]
    });
  }

  // Init Chat with history
  const chat = ai.chats.create({
    model,
    history: fullHistory as any,
    config: { temperature: 0.4 }
  });

  // Send the last message
  const result = await chat.sendMessage({ message: lastUserMsg.text });
  return result.text || "";
};


// 2. OpenAI / DeepSeek Provider (Compatible APIs)
const callOpenAICompatible = async (
  key: StoredKey,
  model: string,
  messages: ChatMessage[],
  systemContext?: string
): Promise<string> => {
  const baseUrl = key.baseUrl ? key.baseUrl.replace(/\/+$/, '') : 
                  (key.provider === 'deepseek' ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
  
  const url = `${baseUrl}/chat/completions`;

  // Construct Messages
  const apiMessages: any[] = [];

  // System Prompt
  // OpenAI supports a dedicated "system" role.
  if (systemContext) {
    // For this app, the "System Context" is actually a huge User prompt containing the text to analyze.
    // But we can use 'system' role for the Persona instruction and 'user' for the text data.
    // To keep parity with Gemini logic (which puts everything in a User prompt), let's stick to User role for the big context.
    apiMessages.push({ role: 'user', content: systemContext });
  }

  // Append history
  for (const msg of messages) {
    // Skip the last one if we are going to handle it specially? No, OpenAI endpoint takes full list.
    // Wait, `messages` includes the latest user message we want a response for.
    apiMessages.push({ role: msg.role, content: msg.text });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key.value}`
    },
    body: JSON.stringify({
      model: model,
      messages: apiMessages,
      temperature: 0.4,
      stream: false
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};


// --- PUBLIC API ---

export const sendMessageToAI = async (
  key: StoredKey,
  model: string,
  messages: ChatMessage[], // History INCLUDING the latest user message to process
  original: string,
  modified: string,
  personaInstruction: string,
  question?: string
): Promise<string> => {
  
  // 1. Construct the "Context" (The massive first prompt)
  // We always generate this because we are stateless.
  const systemContext = constructSystemPrompt(original, modified, personaInstruction, question);

  // 2. Route to Provider
  if (key.provider === 'google') {
    return callGemini(key, model, messages, systemContext);
  } else {
    return callOpenAICompatible(key, model, messages, systemContext);
  }
};

export const generatePersonaPrompt = async (
  key: StoredKey,
  modelName: string,
  personaName: string
): Promise<string> => {
  const prompt = `
    Task: You are an expert prompt engineer.
    User Goal: The user wants to create a specific "Persona" for an AI text analysis tool.
    Persona Name: "${personaName}"
    
    Action: Write a concise, effective System Instruction (2-3 sentences) that an AI should follow to act as this persona. 
    Focus on the tone, what to look for in text changes, and evaluation criteria. 
    Do NOT include introductory text like "Here is the prompt", just output the prompt itself.
  `;

  // Create a temporary message structure for the single-shot call
  const messages: ChatMessage[] = [{
    id: 'temp', role: 'user', text: prompt, timestamp: Date.now()
  }];

  if (key.provider === 'google') {
     // Simplified call for Gemini
     const ai = new GoogleGenAI({ apiKey: key.value });
     const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt
     });
     return result.text?.trim() || "";
  } else {
     return callOpenAICompatible(key, modelName, messages); // Reuse generic logic, no system context needed for this simple task
  }
};
