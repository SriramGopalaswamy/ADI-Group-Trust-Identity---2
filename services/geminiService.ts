import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const editImageWithGemini = async (base64Image: string, prompt: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure the environment.");
  }

  // Remove header if present (e.g., data:image/jpeg;base64,)
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          },
          {
            text: `Edit this image: ${prompt}. Return ONLY the edited image.`
          }
        ]
      }
    });

    // Extract the image from the response parts
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           // Assume JPEG for simplicity, or detect from mimeType if available
           return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image returned from Gemini.");

  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    throw error;
  }
};
