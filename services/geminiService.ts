import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { AppMode, GeneratorInputs, ArticleHistoryItem, HubPageType } from '../types';

const getClient = () => {
  let apiKey = '';

  // 1. Try Vite standard (Vercel / Vite Dev)
  try {
    // @ts-ignore - import.meta.env might be undefined in some environments
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error if import.meta is not available
  }

  // 2. Try process.env (AI Studio Sandbox / Node compatibility fallback)
  if (!apiKey) {
    try {
      // @ts-ignore
      if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
      }
    } catch (e) {
      // Ignore error if process is not available
    }
  }
  
  if (!apiKey) {
    console.error("API Key check failed. Envs checked: import.meta.env, process.env");
    throw new Error("API Key is missing. Please set VITE_API_KEY (Vercel) or API_KEY (Sandbox).");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateImage = async (prompt: string, isChart: boolean = false): Promise<string | null> => {
  const ai = getClient();
  
  // Enforce Brand & Regional Style
  // Taiwan/East Asian people, Soft Lighting, Brand Colors
  let styleModifier = ". High quality, photorealistic, lifestyle photography, soft lighting, pastel tones, #395A77 color accents. Subjects must be Taiwanese/East Asian people, natural look. No text overlays.";
  
  if (isChart) {
    styleModifier = ". High quality clean infographic design, minimal modern chart, data visualization, soft colors #395A77 and white, professional vector style, no gibberish text.";
  }

  const finalPrompt = `${prompt} ${styleModifier}`;

  const tryGenerate = async (modelName: string) => {
     return await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: finalPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });
  };

  try {
    // Try primary model
    let response;
    try {
      response = await tryGenerate('gemini-2.5-flash-image');
    } catch (e) {
      console.warn("Gemini 2.5 Flash Image failed, trying fallback...", e);
      // Fallback to Imagen if available or supported in context
      try {
         // Note: Assuming imagen-3.0-generate-001 is available for this key, 
         // otherwise this catch block will return null below.
         // We use generateImages for Imagen models usually, but for simplicity in this 
         // unified service we attempt the content generation endpoint if supported,
         // or specific imagen call. 
         // *However*, @google/genai SDK separates them.
         // Let's stick to a retry or return null to avoid complexity if user key doesn't support Imagen.
         // Instead, we will catch and return null.
         return null; 
      } catch (fallbackError) {
         return null;
      }
    }

    for (const part of response?.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || 'image/jpeg';
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null; 
  }
};

export const optimizeTitle = async (topic: string): Promise<string[]> => {
  const ai = getClient();
  const prompt = `你是專業的內容行銷編輯。請針對主題「${topic}」，提供 3 個吸引人點擊、符合 SEO、且語氣溫暖不誇大的文章標題。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (e) {
    console.error("Title Optimization Error", e);
    return [];
  }
};

export const generateContent = async (
  mode: AppMode, 
  inputs: GeneratorInputs,
  history: ArticleHistoryItem[] = []
): Promise<string> => {
  const ai = getClient();
  
  let userPrompt = `請執行 mode = ${mode}。\n\n`;

  // Provide Context of existing articles for "Extended Reading"
  const historyContext = history.length > 0 
    ? `\n\n【已生成文章列表 (用於延伸閱讀推薦)】：\n${history.map(h => `- ${h.title} (分類: ${h.category})`).join('\n')}\n`
    : `\n\n【已生成文章列表】：目前無，請自行推薦相關主題。\n`;

  if (mode === AppMode.HUB_PAGE) {
    const type = inputs.hubPageType || HubPageType.BRAND_STORY;
    const customConcept = inputs.brandConcept ? `額外核心概念：${inputs.brandConcept}` : '';
    
    userPrompt += `任務：請為「璽歡 likeyou」設計官網的【璽歡心生活專區 (Brand Core Hub)】內容。
    核心理念：「璽歡心生活」—— 不只是健康，更是懂生活、懂情緒、自我覺察的旅程。
    
    本次撰寫類別：【${type}】
    ${customConcept}

    請依據類別撰寫深度內容：
    
    ${type === HubPageType.BRAND_STORY ? `
    1. **品牌緣起 (Origin)**：請以感性角度切入，敘述為什麼創立「璽歡 likeyou」。強調在忙碌現代生活中，找回對身體與心靈的掌控感。
    2. **核心價值 (Core Values)**：闡述「健康 × 輕生活 × 文創感」如何落實在產品與內容中。
    3. **願景 (Vision)**：希望帶給消費者的不只是商品，而是一種「被理解」的溫暖。
    ` : `
    1. **情緒價值主張 (Emotional Proposition)**：探討現代人的隱性焦慮或孤獨，並提出「璽歡」如何作為陪伴者。
    2. **心生活練習 (Mindful Practice)**：提出 3 個具體的、簡單的日常心靈練習（如專注喝一杯水、睡前感謝）。
    3. **共鳴連結 (Connection)**：用溫暖的文字連結品牌與讀者的內心世界。
    `}

    請務必生成 3-5 張符合「心靈、生活感、品牌藍色調」的圖片 Prompt (使用 {{GENERATE_IMAGE:...}} 格式)。
    ${historyContext}`;

  } else if (mode === AppMode.ARTICLE_PLAN) {
    userPrompt += `分類名稱：${inputs.category}\n預計數量：${inputs.quantity} 篇。
    請特別注意：除了標題與大綱外，請為這個分類生成一張「情境 Mood Board」的圖片 Prompt (使用 {{GENERATE_IMAGE: 英文 Prompt | 中文 ALT}} 格式)，讓使用者能感受到此分類的視覺氛圍。
    ${historyContext}`;
  } else if (mode === AppMode.ARTICLE) {
    userPrompt += `分類名稱：${inputs.category}\n文章主題：${inputs.topic}\n目標字數：${inputs.wordCount}
    \n請務必生成最少 3-5 張圖片（含封面）。若內容涉及分析，請生成圖表。
    請務必在 SEO 區塊前加入【延伸閱讀】，優先連結上述「已生成文章列表」。
    ${historyContext}`;
  } else if (mode === AppMode.TREND_ARTICLE) {
    userPrompt += `時事主題：${inputs.trendTopic}
    \n請撰寫成一篇結合生活、情緒或健康的軟性文章。
    請務必生成最少 3-5 張圖片（含封面）。
    ${historyContext}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, 
      },
      contents: userPrompt,
    });

    let content = response.text || "No content generated.";

    // --- Image/Chart Injection Logic ---
    // Matches {{GENERATE_IMAGE: ...}} OR {{GENERATE_CHART: ...}}
    // Updated Regex to capture "Prompt | Alt Text" structure
    const tagRegex = /\{\{GENERATE_(IMAGE|CHART):\s*(.*?)\s*\|\s*(.*?)\}\}/g;
    
    const matches = [...content.matchAll(tagRegex)];
    
    if (matches.length > 0) {
      const replacements = await Promise.all(
        matches.map(async (match) => {
          const originalTag = match[0];
          const type = match[1]; // IMAGE or CHART
          const prompt = match[2];
          const altText = match[3];
          const isChart = type === 'CHART';
          
          try {
            const base64Image = await generateImage(prompt, isChart);
            if (base64Image) {
              const label = isChart ? '資訊圖表' : '情境示意圖';
              // If it's the very first image (likely cover), make it larger or distinct
              return {
                original: originalTag,
                replacement: `\n\n![${altText || label}](${base64Image})\n*${altText || label}*\n\n`
              };
            }
          } catch (e) {
            console.warn(`Failed to generate ${type}:`, prompt);
          }
          
          return {
            original: originalTag,
            replacement: `> [${type} 生成失敗: ${altText}]`
          };
        })
      );

      for (const { original, replacement } of replacements) {
         content = content.replace(original, replacement);
      }
    } else {
      // Fallback for old prompt format matching (just in case model forgets | separator)
      const oldTagRegex = /\{\{GENERATE_(IMAGE|CHART):\s*(.*?)\}\}/g;
      const oldMatches = [...content.matchAll(oldTagRegex)];
      if (oldMatches.length > 0) {
         const replacements = await Promise.all(
          oldMatches.map(async (match) => {
            const originalTag = match[0];
            const type = match[1];
            const prompt = match[2];
            const isChart = type === 'CHART';
            
            try {
              const base64Image = await generateImage(prompt, isChart);
              if (base64Image) {
                 return {
                  original: originalTag,
                  replacement: `\n\n![Image](${base64Image})\n*${prompt}*\n\n`
                };
              }
            } catch (e) {
               console.warn(`Failed to generate ${type}:`, prompt);
            }
            return { original: originalTag, replacement: '' };
          })
         );
         for (const { original, replacement } of replacements) {
           content = content.replace(original, replacement);
         }
      }
    }

    return content;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate content.");
  }
};

export const getTrendingTopics = async (): Promise<string[]> => {
  const ai = getClient();
  
  // Broader search scope: Lifestyle, Tech, Emotion, Health, Current Events
  const prompt = `請搜尋目前台灣地區 10 個最熱門的話題，範圍包含：「時事新聞、AI 科技趨勢、生活補貼、季節天氣、流行傳染病、情緒與心理健康、飲食風潮」。
  請列出 10 個適合撰寫成「軟性生活/健康觀點」文章的短標題（不要超過 15 個字）。
  結果請單純以 JSON 陣列格式回傳，例如：["AI繪圖對心理影響", "寒流保暖穿搭", "普發6000元運用", "ChatGPT工作焦慮"]。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return text.split('\n').filter(line => line.trim().length > 0).slice(0, 10);

  } catch (error) {
    console.error("Trend Search Error:", error);
    throw error; // Re-throw to show error in UI
  }
};
