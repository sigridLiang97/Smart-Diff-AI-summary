import { GoogleGenAI } from "@google/genai";

/**
 * Generates a summary of changes between two texts using Gemini.
 * Now requires apiKey to be passed in, supporting the "Bring Your Own Key" client-side model.
 */
export const generateDiffSummary = async (
  original: string, 
  modified: string, 
  modelName: string, 
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key is missing. Please set your Google Gemini API Key in the settings.";
  }

  // Initialize the client inside the function call with the user's key
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const prompt = `
      You are an expert editor and proofreader. I have two versions of a text.
      
      Original Text:
      """
      ${original}
      """

      Modified Text:
      """
      ${modified}
      """

      Please provide a concise but insightful summary of the changes.
      
      Requirements:
      1. **Language**: The analysis must be written in **Chinese**.
      2. **Content**: Highlight the main differences (content added, removed, or rephrased) and analyze the intent (e.g., "Improved clarity", "Corrected grammar").
      3. **Quoting**: You may quote the original English words/phrases if necessary for context, but do NOT provide a full bilingual sentence-by-sentence translation.
      4. **Format**: Use Markdown (bullet points are preferred).
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.3, // Lower temperature for more analytical/factual results
      }
    });

    return response.text || "Unable to generate summary.";
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    
    // Friendly error messages
    if (error.message?.includes('403') || error.toString().includes('API key')) {
      return "Error: Invalid API Key. Please check your key in the settings.";
    }
    
    return `Error: Failed to generate summary (${error.message || 'Unknown error'}).`;
  }
};