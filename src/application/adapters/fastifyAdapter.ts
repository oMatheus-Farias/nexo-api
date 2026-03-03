import type { Controller } from '@domain/contracts/Controller';
import { Registry } from '@kermel/di/Registry';
import { fastifyBodyParser } from '@main/utils/fastifyBodyParser';
import type { Constructor } from '@shared/type/Constructor';
import type { FastifyReply, FastifyRequest } from 'fastify';

export function fastifyAdapter<TType extends 'public' | 'private', TBody>(
  controllerImpl: Constructor<Controller<TType, TBody>>,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const controller = Registry.getInstance().resolve(controllerImpl);

    const body = fastifyBodyParser(request.body);
    const params = (request.params ?? {}) as Record<string, unknown>;
    const queryParams = (request.query ?? {}) as Record<string, unknown>;
    const userId = request.user?.sub ?? null;

    const controllerRequest = {
      body,
      params,
      queryParams,
      userId,
    } as unknown as Controller.Request<TType>;

    const response = await controller.execute(controllerRequest);

    if (response.headers) {
      reply.headers(response.headers);
    }

    reply.status(response.statusCode).send(response.body);
  };
}
