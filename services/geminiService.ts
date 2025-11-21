
import { GoogleGenAI, ChatSession, Content } from "@google/genai";
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

/**
 * Initializes a chat session with the specific context of the two texts.
 */
export const startAnalysisChat = async (
  apiKey: string,
  modelName: string,
  original: string,
  modified: string,
  systemInstruction: string, // Now accepts the raw prompt string
  question?: string
): Promise<{ session: ChatSession, initialResponse: string }> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Construct the System Instruction / Initial Context
  const questionContext = question 
    ? `SPECIFIC QUESTION/GOAL: The user wants to know: "${question}".\nCompare which version better answers this question or achieves this goal.`
    : `TASK: Compare the quality of the two texts. Highlight improvements and potential regressions.`;

  const initialPrompt = `
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
 * This allows users to continue chatting after loading a history item.
 */
export const resumeAnalysisChat = async (
  apiKey: string,
  modelName: string,
  historyMessages: ChatMessage[],
  original: string,
  modified: string,
  systemInstruction: string,
  question?: string
): Promise<ChatSession> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  // We need to re-inject the context so the model knows what we are talking about
  // because the 'history' prop in create() sets the visible history, 
  // but we usually want to ensure the system context is fresh in the model's "mind".
  
  // However, simply passing history is often enough for Gemini if the history contains the full context.
  // Assuming historyMessages[0] contains the big prompt we sent in startAnalysisChat.
  
  const sdkHistory = historyMessages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const chat = ai.chats.create({
    model: modelName,
    history: sdkHistory,
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
  session: ChatSession,
  message: string
): Promise<string> => {
  const result = await session.sendMessage({
    message: message
  });
  return result.text || "No response.";
};
