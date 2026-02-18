import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("API key missing");
    return null;
  }

  return new GoogleGenAI({ apiKey });
};


// Use stable aliases for broader key compatibility
const STABLE_MODEL = 'gemini-flash-latest';
const PREVIEW_MODEL = 'gemini-3-flash-preview';

export const generateCropDescription = async (cropName: string, lang: string = 'en') => {
  const ai = getAIClient();
  if (!ai) return "Description unavailable (API Key missing).";
  try {
    const response = await ai.models.generateContent({
      model: STABLE_MODEL,
      contents: `Provide a detailed agricultural description for ${cropName} in ${lang}. Include soil needs, harvesting tips, and market demand summary. Keep it under 100 words.`,
    });
    return response.text;
  } catch (error) {
    console.error("Description error:", error);
    return null;
  }
};

export const getCropGuidelines = async (cropName: string, lang: string = 'en') => {
  const ai = getAIClient();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: STABLE_MODEL,
      contents: `Provide a detailed growth guide for ${cropName} in language: ${lang}. Return strictly valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            durationDays: { type: Type.STRING },
            fertilizer: { type: Type.STRING },
            soil: { type: Type.STRING },
            temperature: { type: Type.STRING },
            stages: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["durationDays", "fertilizer", "soil", "temperature", "stages"]
        }
      }
    });
    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
    console.error("Guidelines error:", error);
    return null;
  }
};

export const getFarmingTips = async (location: string, lang: string = 'en') => {
  const ai = getAIClient();
  if (!ai) throw new Error("API_KEY_MISSING");
  
  try {
    const locationPrompt = location.includes(',') ? `Coordinates: ${location}` : `Region: ${location}`;

    const response = await ai.models.generateContent({
      model: PREVIEW_MODEL,
      contents: `Provide 4 highly specific seasonal farming tips for someone at ${locationPrompt}. 
      Language: ${lang}. 
      Focus on current season soil preparation, specific crop selection for this climate, and organic pest control.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Must be one of: Soil, Crops, Weather, Market, Pests" }
                },
                required: ["title", "content", "category"]
              }
            }
          },
          required: ["tips"]
        }
      }
    });
    
    const text = response.text?.trim();
    if (!text) throw new Error("EMPTY_RESPONSE");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Farming tips failure:", error);
    const status = error.status || error.statusCode;
    if (status === 403 || status === 401) throw new Error("INVALID_API_KEY");
    throw error;
  }
};

export const getVendorTips = async (location: string, lang: string = 'en') => {
  const ai = getAIClient();
  if (!ai) throw new Error("API_KEY_MISSING");
  
  try {
    const response = await ai.models.generateContent({
      model: PREVIEW_MODEL,
      contents: `Provide 4 expert tips for an agricultural vendor at ${location}. 
      Language: ${lang}. 
      Focus on crop maintenance (freshness preservation), selling strategy (market demand), and transport logistics.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Must be one of: Maintenance, Selling, Logistics, Quality" }
                },
                required: ["title", "content", "category"]
              }
            }
          },
          required: ["tips"]
        }
      }
    });
    
    const text = response.text?.trim();
    return JSON.parse(text || '{"tips":[]}');
  } catch (error) {
    console.error("Vendor tips failure:", error);
    throw error;
  }
};

export const getCommunityTips = async (location: string, lang: string = 'en') => {
  const ai = getAIClient();
  if (!ai) throw new Error("API_KEY_MISSING");
  
  try {
    const response = await ai.models.generateContent({
      model: PREVIEW_MODEL,
      contents: `Provide 4 expert tips for a community member managing farmers in a 30km radius around ${location}. 
      Language: ${lang}. 
      Focus on farmer digital literacy, local logistic synchronization, and crop quality monitoring.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Must be one of: Support, Growth, Technology, Logistics" }
                },
                required: ["title", "content", "category"]
              }
            }
          },
          required: ["tips"]
        }
      }
    });
    
    const text = response.text?.trim();
    return JSON.parse(text || '{"tips":[]}');
  } catch (error) {
    console.error("Community tips failure:", error);
    throw error;
  }
};

export const diagnoseCrop = async (
  base64Image: string,
  lang: string = 'en'
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Diagnostic service unavailable (API Key missing).";

  try {
    const response = await ai.models.generateContent({
      model: STABLE_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          {
            text: `Act as an expert agronomist. Identify any diseases, pests, or nutrient deficiencies in this plant image.
            Provide a diagnosis and specific, organic treatment steps in ${lang}.`
          }
        ]
      }
    });

  
    return response.text ?? "No diagnosis could be generated.";
  } catch (error) {
    console.error("Diagnostic error:", error);
    return "Could not analyze the image.";
  }
};


export const agriChat = async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], lang: string = 'en', location?: string) => {
  const ai = getAIClient();
  if (!ai) return "Assistant unavailable.";
  try {
    const locContext = location ? `The user is at: ${location}.` : 'The user location is unknown.';
    const response = await ai.models.generateContent({
      model: STABLE_MODEL,
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: `You are AgriBot, an expert agricultural assistant. Answer strictly in ${lang}. Be helpful and use easy language. ${locContext}`
      }
    });
    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting right now.";
  }
};