import z from 'zod';

export const refreshTokenSchema = z.object({
  refresh_token: z.uuidv7("Invalid 'refresh_token' format, must be a valid UUIDv7"),
});

export type RefreshTokenBody = z.infer<typeof refreshTokenSchema>;
