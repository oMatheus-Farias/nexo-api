import { fastifyAdapter } from '@application/adapters/fastifyAdapter';
import { GetMeController } from '@application/controllers/users/GetMeController';
import type { FastifyInstance } from 'fastify';

export async function userRoutes(app: FastifyInstance) {
  const prefix = '/users';

  const getMeController = fastifyAdapter(GetMeController);

  app.get(`${prefix}/me`, { schema: {} }, getMeController);
}
