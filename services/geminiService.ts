import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { AppMode, GeneratorInputs } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateContent = async (mode: AppMode, inputs: GeneratorInputs): Promise<string> => {
  const ai = getClient();
  
  // Construct the specific user prompt based on inputs
  let userPrompt = `請執行 mode = ${mode}。\n\n`;

  if (mode === AppMode.HUB_PAGE) {
    userPrompt += `請為「健康新知識」主頁產生完整內容規劃。`;
  } else if (mode === AppMode.ARTICLE_PLAN) {
    userPrompt += `分類名稱：${inputs.category}\n預計數量：${inputs.quantity} 篇`;
  } else if (mode === AppMode.ARTICLE) {
    userPrompt += `分類名稱：${inputs.category}\n文章主題：${inputs.topic}\n目標字數：${inputs.wordCount}`;
  } else if (mode === AppMode.TREND_ARTICLE) {
    userPrompt += `時事主題：${inputs.trendTopic}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Slightly creative but controlled
      },
      contents: userPrompt,
    });

    return response.text || "No content generated. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate content. Please check your API key and try again.");
  }
};

export const generateImage = async (topic: string): Promise<string | null> => {
  const ai = getClient();
  const imagePrompt = `A clean, aesthetic, lifestyle photography style image suitable for a health blog header about: "${topic}". Soft lighting, pastel tones, minimal composition, high quality, no text, warm atmosphere.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null; 
  }
};

export const getTrendingTopics = async (): Promise<string[]> => {
  const ai = getClient();
  
  const prompt = `請搜尋目前台灣地區關於「健康、季節天氣、流行傳染病、飲食、生活補貼政策」的近期熱門新聞或話題。
  請列出 5 個最熱門且適合撰寫成軟性健康文章的短標題（不要超過 15 個字）。
  結果請單純以 JSON 陣列格式回傳，例如：["寒流來襲保暖技巧", "腸病毒預防", "普發6000元運用"]。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    // Attempt to parse JSON from the response text (it might be wrapped in code blocks)
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback simple split if JSON parsing fails but text exists
    return text.split('\n').filter(line => line.trim().length > 0).slice(0, 5);

  } catch (error) {
    console.error("Trend Search Error:", error);
    throw new Error("Failed to fetch trending topics.");
  }
};