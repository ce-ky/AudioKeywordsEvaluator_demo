
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcribes audio and returns the full text verbatim AND the detected language.
 * This function uses Multilingual ASR capabilities.
 */
export const analyzeAudio = async (
  base64Audio: string,
  mimeType: string
): Promise<{ text: string; language: string }> => {
  try {
    const modelId = "gemini-2.5-flash"; 

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
            text: `Please analyze this audio file.
            1. Provide a verbatim transcription of what is spoken. Do not translate.
            2. Detect the primary language spoken (return ISO 639-1 code, e.g., 'zh', 'en', 'ja').
            
            Return the result purely as a JSON object with the following schema:
            {
              "text": "The transcription text...",
              "language": "en" 
            }
            Do not include markdown formatting like \`\`\`json.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) {
      throw new Error("No response from Gemini.");
    }

    const result = JSON.parse(jsonStr);
    return {
        text: result.text || "",
        language: result.language || "zh" // Default to zh if detection fails
    };

  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
};

/**
 * Translates a list of keywords to a target language for cross-language matching.
 * Returns a map of { "Original Keyword": "Translated Keyword" }
 */
export const translateTextList = async (
    texts: string[], 
    targetLanguage: string
): Promise<Record<string, string>> => {
    try {
        const modelId = "gemini-2.5-flash";
        const prompt = `
        You are a translation engine. 
        Translate the following list of terms into ${targetLanguage}.
        Keep the meaning precise for professional matching.
        
        Input List: ${JSON.stringify(texts)}
        
        Output a JSON object where keys are the original terms and values are the translated terms.
        Example: { "你好": "Hello", "世界": "World" }
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' }
        });

        const jsonStr = response.text;
        if (!jsonStr) return {};
        
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Translation error:", error);
        return {}; // Return empty map on failure, fallback to original
    }
};

/**
 * Analyzes the transcription for keyword matches using Gemini LLM.
 * Returns exact matches (absolute_pair), semantic/fuzzy matches (blur_pair),
 * and a marked version of the transcript.
 */
export const analyzeKeywordsWithLLM = async (
  transcription: string,
  keywords: string[]
): Promise<{ 
  analysis: Array<{ object: string; absolute_pair: number; blur_pair: number; fuzzy_segments: string[] }>;
  marked_transcript: string;
} | null> => {
  try {
    const modelId = "gemini-2.5-flash";
    
    const systemPrompt = `
# Role
你是一名精密级关键词匹配探查师。
你的任务是对给定的文本段落进行逐词扫描与语义分析，并对用户提供的关键词列表进行语义匹配。
你将以极高的敏感度和严谨性执行匹配任务，确保无遗漏、无误判。

# Workflow
1. 用户将提供需要比对的关键词清单，记为 {{messages}}。
2. 用户将提供一段完整文段，用于匹配分析，记为 {{audio}}。
3. 对于 {{messages}} 中的每一个关键词：
 - 在 {{audio}} 中进行全文扫描，统计该关键词精准出现的次数，记为 absolute_pair (n)。
 - 在排除精准匹配位置后，再次扫描文本，根据语义相似度判断是否存在语义层面的提及。
 - 统计模糊匹配次数，记为 blur_pair (m)。
 - 提取出文中所有被判定为【模糊匹配/语义匹配】的具体文本片段（substrings），放入 fuzzy_segments 数组中。

4. **标记原文 (Mark Transcript)**
   返回一个新的文本字符串 'marked_transcript'，它是 {{audio}} 的副本，但进行了如下标记：
   - 将所有【精准匹配】的词语用 [e]...[/e] 包裹。
   - 将所有【模糊/语义匹配】的片段用 [f]...[/f] 包裹。
   - 确保标记不会破坏原文的句子结构，除此之外不要修改原文内容。

# Standard
1. 精准匹配 [e]
满足以下任一条件即可计入精准匹配：
文本中出现与关键词完全一致的字符串（允许大小写差异）。
文本中出现关键词的常见正字变体（如简繁转换、全半角差异）。
若关键词为多词短语，则所有词语需连续出现并构成原意。
不计入精准匹配的情况：
关键词被拆碎或顺序改变；
出现同音字但意义不同；
仅提及关键词的一部分而不足以构成原意。

2. 语义匹配（semantic match） [f]
当文本段落中出现的内容与关键词所指代的概念、现象、特征或内涵具有明确、可验证的语义关联时，计入语义匹配。
语义匹配应满足以下至少一项：
文本中出现关键词的同义词、近义词、专业术语替代表达；
文本描述了与关键词密切相关的行为、功能、作用、场景或背景；
文本中出现该关键词对应的上位词或下位词，能构成明显的语义引用。
语义匹配不得包含：
牵强联想、逻辑跳跃；
无实质内容的泛泛描述；
与关键词无直接关联的比喻、意象或文学表达。

# Output Format
Output ONLY a JSON object containing two fields: "analysis" (the array) and "marked_transcript" (the string).
`;

    const userPrompt = `
{{messages}}: ${JSON.stringify(keywords)}

{{audio}}: ${transcription}
`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + userPrompt }] }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  object: { type: Type.STRING },
                  absolute_pair: { type: Type.INTEGER },
                  blur_pair: { type: Type.INTEGER },
                  fuzzy_segments: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "The exact substrings from the text that were identified as semantic/fuzzy matches."
                  }
                }
              }
            },
            marked_transcript: {
              type: Type.STRING,
              description: "The full transcript with exact matches wrapped in [e]tags[/e] and fuzzy matches wrapped in [f]tags[/f]."
            }
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) {
      throw new Error("No JSON response from Gemini keyword analysis.");
    }

    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Gemini keyword analysis error:", error);
    return null;
  }
};
