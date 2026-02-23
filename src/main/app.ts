import { fastify } from 'fastify';
import { type ZodTypeProvider } from 'fastify-type-provider-zod';

export const app = fastify().withTypeProvider<ZodTypeProvider>();

app.get('/', (_, reply) => {
  reply.send({ message: '🟢 API is running!' });
});
