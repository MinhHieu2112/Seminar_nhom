
import { GoogleGenAI } from "@google/genai";

export const getDesignAdvice = async (userMessage: string) => {
  try {
    // Initializing with apiKey property directly from process.env as required
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Bạn là một kiến trúc sư và chuyên gia thiết kế nội thất cao cấp của LuxDecor. Hãy trả lời câu hỏi sau bằng tiếng Việt một cách chuyên nghiệp, sáng tạo và thân thiện: ${userMessage}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Xin lỗi, LuxDecor AI hiện đang bận. Vui lòng thử lại sau!";
  }
};
