import { fastifyAdapter } from '@application/adapters/fastifyAdapter';
import { GithubCallbackController } from '@application/controllers/auth/GithubCallbackController';
import { GithubOAuthController } from '@application/controllers/auth/GithubOAuthController';
import { GoogleCallbackController } from '@application/controllers/auth/GoogleCallbackController';
import { GoogleOAuthController } from '@application/controllers/auth/GoogleOAuthController';
import { RefreshTokenController } from '@application/controllers/auth/RefreshTokenController';
import { SignOutController } from '@application/controllers/auth/SignOutController';
import type { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance) {
  const prefix = '/auth';

  const googleOAuthController = fastifyAdapter(GoogleOAuthController);
  const googleCallbackController = fastifyAdapter(GoogleCallbackController);

  const githubOAuthController = fastifyAdapter(GithubOAuthController);
  const githubCallbackController = fastifyAdapter(GithubCallbackController);

  const refreshTokenController = fastifyAdapter(RefreshTokenController);
  const signOutController = fastifyAdapter(SignOutController);

  app.get(`${prefix}/google`, { schema: {} }, googleOAuthController);
  app.get(`${prefix}/google/callback`, { schema: {} }, googleCallbackController);

  app.get(`${prefix}/github`, { schema: {} }, githubOAuthController);
  app.get(`${prefix}/github/callback`, { schema: {} }, githubCallbackController);

  app.post(`${prefix}/refresh-tokens`, { schema: {} }, refreshTokenController);
  app.post(`${prefix}/sign-out`, { schema: {} }, signOutController);
}
