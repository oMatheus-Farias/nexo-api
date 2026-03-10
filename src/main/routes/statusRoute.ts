import { prismaClient } from '@infra/clients/prismaClient';
import { env } from '@shared/config/env';
import type { FastifyInstance } from 'fastify';

type DatabaseVersionResult = {
  server_version: string;
};

type DatabaseMaxConnectionsResult = {
  max_connections: string;
};

type DatabaseOpenedConnectionsResult = {
  opened_connections: string;
};

export async function statusRoute(app: FastifyInstance) {
  app.get('/status', async (_, reply) => {
    const databaseName = new URL(env.DATABASE_URL).pathname.slice(1);
    const updatedAt = new Date().toISOString();

    const databaseVersionResult =
      (await prismaClient.$queryRaw`SHOW server_version;`) as DatabaseVersionResult[];
    const databaseVersionValue = databaseVersionResult[0]?.server_version ?? 'error_value';

    const databaseMaxConnectionsResult =
      (await prismaClient.$queryRaw`SHOW max_connections;`) as DatabaseMaxConnectionsResult[];
    const databaseMaxConnectionsValue = parseInt(
      databaseMaxConnectionsResult[0]?.max_connections ?? '0',
      10,
    );

    const databaseOpenedConnectionsResult =
      (await prismaClient.$queryRaw`SELECT COUNT(*)::int AS opened_connections FROM pg_stat_activity WHERE datname = ${databaseName};`) as DatabaseOpenedConnectionsResult[];
    const databaseOpenedConnectionsValue = parseInt(
      databaseOpenedConnectionsResult[0]?.opened_connections ?? '0',
      10,
    );

    reply.status(200).send({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseVersionValue,
          max_connections: databaseMaxConnectionsValue,
          opened_connections: databaseOpenedConnectionsValue,
        },
      },
    });
  });
}
