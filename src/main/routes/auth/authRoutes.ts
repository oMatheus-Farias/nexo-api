import { fastifyAdapter } from '@application/adapters/fastifyAdapter';
import { GoogleCallbackController } from '@application/controllers/auth/GoogleCallbackController';
import { GoogleOAuthController } from '@application/controllers/auth/GoogleOAuthController';
import { RefreshTokenController } from '@application/controllers/auth/RefreshTokenController';
import type { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance) {
  const prefix = '/auth';

  const googleOAuthController = fastifyAdapter(GoogleOAuthController);
  const googleCallbackController = fastifyAdapter(GoogleCallbackController);
  const refreshTokenController = fastifyAdapter(RefreshTokenController);

  app.get(`${prefix}/google`, { schema: {} }, googleOAuthController);
  app.get(`${prefix}/google/callback`, { schema: {} }, googleCallbackController);
  app.post(`${prefix}/refresh-tokens`, { schema: {} }, refreshTokenController);
}
