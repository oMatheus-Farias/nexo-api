import { fastifyAdapter } from '@application/adapters/fastifyAdapter';
import { GetRepositoriesController } from '@application/controllers/repositories/GetRepositoriesController';
import { SyncRepositoriesController } from '@application/controllers/repositories/SyncRepositoriesController';
import { ensureAuthenticated } from '@main/middlewares/ensureAuthenticated';
import type { FastifyInstance } from 'fastify';

export async function repositoryRoutes(app: FastifyInstance) {
  const prefix = '/repositories';

  const getRepositoriesController = fastifyAdapter(GetRepositoriesController);
  const syncRepositoriesController = fastifyAdapter(SyncRepositoriesController);

  app.get(
    `${prefix}/paginated`,
    { schema: {}, onRequest: [ensureAuthenticated] },
    getRepositoriesController,
  );
  app.post(
    `${prefix}/sync`,
    { schema: {}, onRequest: [ensureAuthenticated] },
    syncRepositoriesController,
  );
}
