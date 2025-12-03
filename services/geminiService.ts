import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcribes audio and returns the full text verbatim.
 * This function uses Multilingual ASR capabilities to detect the language(s)
 * automatically and transcribe exactly what is spoken without translation.
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
            text: `Please provide a verbatim transcription of this audio file. 
            The audio may contain Chinese, English, Japanese, or a mix of these languages. 
            Transcribe exactly what is spoken in the original language used by the speaker. 
            Do not translate the content. 
            Do not add any commentary or markdown formatting, just provide the raw transcription text.`,
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