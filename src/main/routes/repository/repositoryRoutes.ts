import { fastifyAdapter } from '@application/adapters/fastifyAdapter';
import { AddRepositoriesController } from '@application/controllers/repositories/AddRepositoriesController';
import { DiscoverRepositoriesController } from '@application/controllers/repositories/DiscoverRepositoriesController';
import { GetRepositoriesController } from '@application/controllers/repositories/GetRepositoriesController';
import { SyncRepositoriesController } from '@application/controllers/repositories/SyncRepositoriesController';
import { SyncRepositoryController } from '@application/controllers/repositories/SyncRepositoryController';
import { UpdateRepositoryController } from '@application/controllers/repositories/UpdateRepositoryController';
import { ensureAuthenticated } from '@main/middlewares/ensureAuthenticated';
import type { FastifyInstance } from 'fastify';

export async function repositoryRoutes(app: FastifyInstance) {
  const prefix = '/repositories';

  const addRepositoriesController = fastifyAdapter(AddRepositoriesController);
  const discoverRepositoriesController = fastifyAdapter(DiscoverRepositoriesController);
  const getRepositoriesController = fastifyAdapter(GetRepositoriesController);
  const syncRepositoriesController = fastifyAdapter(SyncRepositoriesController);
  const syncRepositoryController = fastifyAdapter(SyncRepositoryController);
  const updateRepositoryController = fastifyAdapter(UpdateRepositoryController);

  app.get(
    `${prefix}/discover`,
    { schema: {}, onRequest: [ensureAuthenticated] },
    discoverRepositoriesController,
  );
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
  app.post(
    `${prefix}/add`,
    { schema: {}, onRequest: [ensureAuthenticated] },
    addRepositoriesController,
  );
  app.post(
    `${prefix}/:id/sync`,
    { schema: {}, onRequest: [ensureAuthenticated] },
    syncRepositoryController,
  );
  app.patch(
    `${prefix}/:id`,
    { schema: {}, onRequest: [ensureAuthenticated] },
    updateRepositoryController,
  );
}
