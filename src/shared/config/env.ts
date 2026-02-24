import { z } from 'zod';

const schema = z.object({
  PORT: z.string().default('3333'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
});

export const env = schema.parse(process.env);
