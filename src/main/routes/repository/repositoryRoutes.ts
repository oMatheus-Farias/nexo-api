import { fastifyAdapter } from '@application/adapters/fastifyAdapter';
import { GetRepositoriesController } from '@application/controllers/repositories/GetRepositoriesController';
import type { FastifyInstance } from 'fastify';

export async function repositoryRoutes(app: FastifyInstance) {
  const prefix = '/repositories';

  const getRepositoriesController = fastifyAdapter(GetRepositoriesController);

  app.get(`${prefix}/paginated`, { schema: {}, onRequest: [] }, getRepositoriesController);
}
