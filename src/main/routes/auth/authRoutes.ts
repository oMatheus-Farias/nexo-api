import { fastifyAdapter } from '@application/adapters/fastifyAdapter';
import { RefreshTokenController } from '@application/controllers/auth/RefreshTokenController';
import type { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance) {
  const refreshTokenController = fastifyAdapter(RefreshTokenController);

  app.post('/refresh-tokens', { schema: {} }, refreshTokenController);
}
