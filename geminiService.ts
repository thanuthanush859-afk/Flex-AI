
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "Flex ai", an advanced AI tutor designed to provide SHORT and UNDERSTANDABLE answers to students.
You help with ALL subjects including Mathematics, Physics, Chemistry, Biology, English, History, Geography, Computer Science, and General Knowledge.

Your goal is to be concise while ensuring conceptual clarity.

Follow these teaching rules:
1. Keep answers SHORT and to the point.
2. Use SIMPLE language suitable for school students.
3. For Mathematics or numerical questions, show brief step-by-step solutions.
4. Break difficult problems into small, manageable steps.
5. If the question is incomplete, ask for more details briefly.
6. Be friendly and supportive.
7. Use bullet points and clear formatting for readability.
8. Prioritize brevity without sacrificing accuracy.

Response format:
📘 Subject: [Subject Name]
❓ Question: [The Question]
✅ Final Answer: [The Answer]

🧠 Brief Explanation:
[Steps/Explanation]

💡 Quick Tip:
[Tip]
`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async solveQuestion(
    prompt: string, 
    imageBase64?: string, 
    inputMethod: 'text' | 'voice' | 'image' = 'text',
    subject: string = 'General'
  ): Promise<string> {
    const model = 'gemini-3.1-pro-preview';
    
    let fullPrompt = `[SUBJECT: ${subject}] ${prompt}`;
    if (inputMethod === 'voice') {
      fullPrompt = `[SUBJECT: ${subject}] [VOICE INPUT] ${prompt}`;
    } else if (inputMethod === 'image' || imageBase64) {
      fullPrompt = `[SUBJECT: ${subject}] [IMAGE INPUT] ${prompt || 'Please solve the question in this image.'}`;
    }

    const parts: any[] = [{ text: fullPrompt }];
    
    if (imageBase64) {
      parts.unshift({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64.split(',')[1] || imageBase64,
        },
      });
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      return response.text || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm having trouble connecting to my brain right now. Please try again later!";
    }
  }
}
