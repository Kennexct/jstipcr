import { GoogleGenAI } from '@google/genai';

// We fallback to a generic error if no API key is present
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// It's generally unsafe to put API keys in the frontend, but for a local/Vite
// demo environment, this is standard.
export const isAiConfigured = () => apiKey.trim() !== '';

let ai: GoogleGenAI | null = null;
if (isAiConfigured()) {
  ai = new GoogleGenAI({ apiKey });
}

export interface ProductAnalysis {
  name: string;
  price: number;
}

export async function analyzeProductImage(base64Image: string): Promise<ProductAnalysis | null> {
  if (!ai) {
    console.warn('AI is not configured. Missing VITE_GEMINI_API_KEY.');
    return null;
  }

  try {
    // Strip the base64 data URI prefix
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'Analyze this product image. Extract the product name and estimate its cost price in SGD (Singapore Dollars). Return the result strictly in JSON format matching this schema: {"name": "Product Name", "price": 10.50}. If you cannot determine the price, return 0 for price. If you cannot determine the name, use a generic descriptive name.'
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        name: data.name || '',
        price: data.price || 0
      };
    }
    return null;
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return null;
  }
}
