import type { FastifyInstance } from 'fastify';

import { fastifyAdapter } from '../../../application/adapters/fastifyAdapter';
import { GithubAppCallbackController } from '../../../application/controllers/auth/GithubAppCallbackController';
import { ListGithubRepositoriesController } from '../../../application/controllers/github/ListGithubRepositoriesController';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated';

export async function githubRoutes(app: FastifyInstance) {
  const prefix = '/github';

  const githubAppCallbackController = fastifyAdapter(GithubAppCallbackController);
  const listGithubRepositoriesController = fastifyAdapter(ListGithubRepositoriesController);

  app.get(`${prefix}/app/callback`, githubAppCallbackController);

  app.get(
    `${prefix}/repositories`,
    { onRequest: [ensureAuthenticated] },
    listGithubRepositoriesController,
  );
}
