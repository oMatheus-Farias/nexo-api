import type { FastifyInstance } from 'fastify';

export async function healthCheckRoute(app: FastifyInstance) {
  app.get('/', (_, reply) => {
    reply.status(200).send({ message: '🟢 API is running' });
  });
}
