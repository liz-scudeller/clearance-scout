import OpenAI from 'openai';
import { env } from './env.js';

let client;

export function getOpenAiClient() {
  if (!env.openAiApiKey) {
    const error = new Error('OPENAI_API_KEY is missing. Add it to server/.env or disable AI_CLASSIFICATION_ENABLED.');
    error.statusCode = 400;
    throw error;
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.openAiApiKey });
  }

  return client;
}
