import { GoogleGenAI, ChatSession, Content } from "@google/genai";
import { Persona } from "../types";

let chatSession: ChatSession | null = null;

const PERSONA_PROMPTS: Record<Persona, string> = {
  general: "You are an expert editor and proofreader. Analyze the changes objectively.",
  interviewer: "You are a strict hiring manager or interviewer. Evaluate the text based on impact, clarity, use of the STAR method (if applicable), and professional presence. Determine which version makes the candidate sound more competent.",
  academic: "You are a professional academic editor. Focus on formal tone, precision, citation style consistency, and logical flow. Point out if the changes improve scientific rigor.",
  reviewer: "You are a critical peer reviewer. Look for gaps in argumentation, clarity of hypothesis, and strength of evidence. Evaluate if the modified text addresses potential reviewer concerns.",
  reader: "You are a general reader with average knowledge. Focus on readability, engagement, flow, and whether the text is boring or confusing."
};

/**
 * Initializes a chat session with the specific context of the two texts.
 */
export const startAnalysisChat = async (
  apiKey: string,
  modelName: string,
  original: string,
  modified: string,
  persona: Persona,
  question?: string
): Promise<{ session: ChatSession, initialResponse: string }> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Construct the System Instruction / Initial Context
  const baseInstruction = PERSONA_PROMPTS[persona];
  const questionContext = question 
    ? `SPECIFIC QUESTION/GOAL: The user wants to know: "${question}".\nCompare which version better answers this question or achieves this goal.`
    : `TASK: Compare the quality of the two texts. Highlight improvements and potential regressions.`;

  const initialPrompt = `
    ${baseInstruction}

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
  // Note: ideally we would use systemInstruction in config, but putting the heavy context in the first prompt 
  // is often more reliable for immediate analysis of large blocks of text in this SDK version.
  const result = await chat.sendMessage({
    message: initialPrompt
  });

  return {
    session: chat,
    initialResponse: result.text || "Analysis generated, but no text returned."
  };
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
