import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcribes audio and returns the full text.
 * We perform keyword matching on the client side to ensure
 * precise control over the UI state, but we rely on Gemini's
 * powerful multimodal capabilities to understand the speech.
 */
export const analyzeAudio = async (
  base64Audio: string,
  mimeType: string
): Promise<string> => {
  try {
    const modelId = "gemini-2.5-flash"; // Optimized for speed and multimodal tasks

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Please provide a verbatim transcription of this audio file. Do not add any commentary, just the spoken text.",
          },
        ],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No transcription received from Gemini.");
    }

    return text;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
};