export const DEFAULT_SYSTEM_PROMPT =
  process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT ||
  "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown in English.";

export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com';

export const DEFAULT_TEMPERATURE = 
  parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || "1");

export const OPENAI_API_TYPE =
  process.env.OPENAI_API_TYPE || 'openai';

export const OPENAI_API_VERSION =
  process.env.OPENAI_API_VERSION || '2023-03-15-preview';

export const OPENAI_ORGANIZATION =
  process.env.OPENAI_ORGANIZATION || '';

export const AZURE_DEPLOYMENT_ID =
  process.env.AZURE_DEPLOYMENT_ID || '';

export const DEFAULT_CHAT_NAME = 'Untitled';

export const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || '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';

export const ELEVEN_LABS_API_KEY =
  process.env.ELEVEN_LABS_API_KEY || '5f3317fbfb943bc146e3f81223c06672';

export const HOST_NAME = process.env.HOST_NAME || 'https://genai-gray.vercel.app';
