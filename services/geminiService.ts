
import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage } from "../types";

/**
 * Generates a system prompt/description for a specific persona name using Gemini.
 */
export const generatePersonaPrompt = async (
  apiKey: string,
  modelName: string,
  personaName: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Task: You are an expert prompt engineer.
    User Goal: The user wants to create a specific "Persona" for an AI text analysis tool.
    Persona Name: "${personaName}"
    
    Action: Write a concise, effective System Instruction (2-3 sentences) that an AI should follow to act as this persona. 
    Focus on the tone, what to look for in text changes, and evaluation criteria. 
    Do NOT include introductory text like "Here is the prompt", just output the prompt itself.
  `;

  const result = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  return result.text?.trim() || `You are ${personaName}. Analyze the text changes accordingly.`;
};

// Helper to build the massive prompt context
const constructInitialPrompt = (
  original: string,
  modified: string,
  systemInstruction: string,
  question?: string
) => {
  const questionContext = question 
    ? `SPECIFIC QUESTION/GOAL: The user wants to know: "${question}".\nCompare which version better answers this question or achieves this goal.`
    : `TASK: Compare the quality of the two texts. Highlight improvements and potential regressions.`;

  return `
    ${systemInstruction}

    ${questionContext}

    Here are the texts to analyze:

    === ORIGINAL TEXT ===
    ${original}
    =====================

    === MODIFIED TEXT ===
    ${modified}
    =====================

    Please provide your initial analysis in Chinese (Markdown format).
    1. Summarize key changes.
    2. ${question ? "Directly answer the user's specific question about which version is better." : "Evaluate the overall improvement."}
    3. Provide a conclusion.
  `;
};

/**
 * Initializes a chat session with the specific context of the two texts.
 */
export const startAnalysisChat = async (
  apiKey: string,
  modelName: string,
  original: string,
  modified: string,
  systemInstruction: string, 
  question?: string
): Promise<{ session: Chat, initialResponse: string }> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const initialPrompt = constructInitialPrompt(original, modified, systemInstruction, question);

  // Initialize Chat
  const chat = ai.chats.create({
    model: modelName,
    config: {
      temperature: 0.4,
    }
  });

  // Send the initial context context as the first message
  const result = await chat.sendMessage({
    message: initialPrompt
  });

  return {
    session: chat,
    initialResponse: result.text || "Analysis generated, but no text returned."
  };
};

/**
 * Resumes a chat session from existing message history.
 * Reconstructs the implicit context (original texts) so the AI knows what we are talking about.
 */
export const resumeAnalysisChat = async (
  apiKey: string,
  modelName: string,
  historyMessages: ChatMessage[],
  original: string,
  modified: string,
  systemInstruction: string,
  question?: string
): Promise<Chat> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  // Reconstruct the initial prompt so the model has the full context of the texts
  const initialPrompt = constructInitialPrompt(original, modified, systemInstruction, question);

  // Convert visible history to SDK format
  const visibleHistory = historyMessages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  // Prepend the "System Context" disguised as the first user message.
  // In startAnalysisChat, we sent `initialPrompt` -> got `response`.
  // In `historyMessages` (UI state), we only stored the `response`.
  // So we need to recreate that first `user` message containing the data.
  const fullHistory = [
    { role: 'user', parts: [{ text: initialPrompt }] },
    ...visibleHistory
  ];

  const chat = ai.chats.create({
    model: modelName,
    history: fullHistory,
    config: {
      temperature: 0.4,
    }
  });

  return chat;
};

/**
 * Sends a follow-up message in the existing chat session.
 */
export const sendFollowUpMessage = async (
  session: Chat,
  message: string
): Promise<string> => {
  const result = await session.sendMessage({
    message: message
  });
  return result.text || "No response.";
};
