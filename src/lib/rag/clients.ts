import { GoogleGenAI } from '@google/genai';
import { OpenRouter } from '@openrouter/sdk';

export const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export const googleGenAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});
