import { z } from 'zod';

const schema = z.object({
  PORT: z.string().default('3333'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  FRONTEND_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_CALLBACK_URL: z.string(),
});

export const env = schema.parse(process.env);
