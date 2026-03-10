import { Unauthorized } from '@application/errors/http/Unauthorized';
import { Encryption } from '@shared/utils/Encryption';
import type { FastifyRequest } from 'fastify';

export async function ensureAuthenticated(request: FastifyRequest) {
  const accessToken = request.cookies['nexo-access-token'];

  if (accessToken) {
    try {
      const decryptedToken = Encryption.decrypt(accessToken);
      request.headers.authorization = `Bearer ${decryptedToken}`;
    } catch {
      throw new Unauthorized();
    }
  }

  try {
    await request.jwtVerify();
  } catch {
    throw new Unauthorized();
  }
}
