import { fastifyAdapter } from '@application/adapters/fastifyAdapter';
import { GenerateGithubRepositoryReportController } from '@application/controllers/reports/GenerateGithubRepositoryReportController';
import { ensureAuthenticated } from '@main/middlewares/ensureAuthenticated';
import type { FastifyInstance } from 'fastify';

export async function reportRoutes(app: FastifyInstance) {
  const prefix = '/reports';

  const generateGithubRepositoryReportController = fastifyAdapter(
    GenerateGithubRepositoryReportController,
  );

  app.post(
    `${prefix}/github/generate`,
    {
      schema: {},
      onRequest: [ensureAuthenticated],
    },
    generateGithubRepositoryReportController,
  );
}
