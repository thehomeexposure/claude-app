import OpenAI from 'openai';
import { AIService } from './types';

export class OpenAIService implements AIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async enhanceImage(imageBuffer: Buffer, prompt?: string): Promise<Buffer> {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // Use DALL-E to enhance the image
    const response = await this.client.images.edit({
      image: imageBuffer as any,
      prompt: prompt || 'Enhance this image with better quality and clarity',
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Failed to enhance image');
    }

    // Download the enhanced image
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async rerenderImage(imageBuffer: Buffer, prompt: string): Promise<Buffer> {
    // Use DALL-E to create a variation based on prompt
    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Failed to rerender image');
    }

    // Download the rerendered image
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}