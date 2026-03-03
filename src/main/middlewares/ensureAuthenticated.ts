import { Unauthorized } from '@application/errors/http/Unauthorized';
import type { FastifyRequest } from 'fastify';

export async function ensureAuthenticated(request: FastifyRequest) {
  try {
    await request.jwtVerify();
  } catch {
    throw new Unauthorized();
  }
}
