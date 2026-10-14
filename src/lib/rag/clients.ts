import { OpenRouter } from '@openrouter/sdk';

const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!openrouterKey) throw new Error('OPENROUTER_API_KEY environment variable is not set.');

export const openrouter = new OpenRouter({ apiKey: openrouterKey });
