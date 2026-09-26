import dotenv from 'dotenv';
dotenv.config();

export const config = {
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  port: process.env.PORT || 3000,
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  wasender: {
    apiUrl: process.env.WASENDER_API_URL || 'https://wasenderapi.com/api',
    apiKey: process.env.WASENDER_API_KEY || '8610|X0eFv8TP6STJGMuJIxdNVkofYIFnq6XbWzmfbhlI93d19213',
    sessionId: process.env.WASENDER_SESSION_ID || '121080',
    webhookSecret: process.env.WASENDER_WEBHOOK_SECRET || 'ae6a6ccb4d85577e0bb7edb44de41899'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || ''
  }
};
