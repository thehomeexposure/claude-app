import { AIService, AIProvider } from './types';
import { OpenAIService } from './openai';
import { GeminiService } from './gemini';

export * from './types';

const services: Record<AIProvider, AIService> = {
  openai: new OpenAIService(),
  gemini: new GeminiService(),
};

export const getAIService = (provider: AIProvider = 'openai'): AIService => {
  return services[provider];
};
