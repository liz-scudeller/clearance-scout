import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'deal-images',
  adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean),
  searchProvider: process.env.SEARCH_PROVIDER || 'serpapi',
  serpApiKey: process.env.SERPAPI_KEY,
  googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY,
  googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
  eventbriteApiKey: process.env.EVENTBRITE_API_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  aiClassificationEnabled: process.env.AI_CLASSIFICATION_ENABLED !== 'false',
  aiAutoApproveThreshold: Number(process.env.AI_AUTO_APPROVE_THRESHOLD || 85),
  aiPendingReviewThreshold: Number(process.env.AI_PENDING_REVIEW_THRESHOLD || 60),
  aiClassificationBatchLimit: Number(process.env.AI_CLASSIFICATION_BATCH_LIMIT || 20)
};

export function validateEnv() {
  const required = ['supabaseUrl', 'supabaseAnonKey', 'supabaseServiceRoleKey'];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
