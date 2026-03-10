import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function removeBackground(base64Image: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: 'Remove the background from this image. Keep only the main clothing item. The output must be the clothing item isolated on a pure white background (#FFFFFF). Output only the processed image.',
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image returned from Gemini");
  } catch (error) {
    console.error("Error removing background:", error);
    // Fallback to original image if Gemini fails or is not configured
    return base64Image;
  }
}
