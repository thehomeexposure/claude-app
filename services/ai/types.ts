export interface AIService {
  enhanceImage(imageBuffer: Buffer, prompt?: string): Promise<Buffer>;
  rerenderImage(imageBuffer: Buffer, prompt: string): Promise<Buffer>;
}

export type AIProvider = 'openai' | 'gemini';
