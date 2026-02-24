import { BadRequest } from '@application/errors/http/BadRequest';
import type { FastifyRequest } from 'fastify';

export function fastifyBodyParser(body: FastifyRequest['body']) {
  try {
    if (!body) {
      return {} as Record<string, unknown>;
    }

    return body as Record<string, unknown>;
  } catch {
    throw new BadRequest('Malformed body');
  }
}
