import 'reflect-metadata';

import { ApplicationError } from '@application/errors/application/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';
import { HttpError } from '@application/errors/http/HttpError';
import { fastifyCookie } from '@fastify/cookie';
import { fastifyCors } from '@fastify/cors';
import { fastifyJwt } from '@fastify/jwt';
import { fastifySwagger } from '@fastify/swagger';
import ScalarApiReference from '@scalar/fastify-api-reference';
import { env } from '@shared/config/env';
import { fastify, type FastifyError } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';

import { authRoutes } from './routes/auth/authRoutes';
import { githubRoutes } from './routes/github/githubRoutes';
import { healthCheckRoute } from './routes/healthCheckRoute';
import { statusRoute } from './routes/statusRoute';
import { userRoutes } from './routes/user/userRoutes';
import { fastifyErrorResponse } from './utils/fastifyErrorResponse';

export const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});

app.register(fastifyCookie);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Nexo API',
      description: 'API for managing Nexo application',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(ScalarApiReference, {
  routePrefix: '/docs',
});

// Routes
app.register(healthCheckRoute);
app.register(statusRoute);
app.register(authRoutes);
app.register(userRoutes);
app.register(githubRoutes);

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return fastifyErrorResponse({
      reply,
      statusCode: 400,
      code: ErrorCode.VALIDATION,
      message: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if ((error as FastifyError).code === 'FST_ERR_VALIDATION') {
    return fastifyErrorResponse({
      reply,
      statusCode: 400,
      code: ErrorCode.VALIDATION,
      message:
        (error as FastifyError).validation?.map((issue) => ({
          field: issue.instancePath.substring(1),
          message: issue.message,
        })) || 'Validation Error',
    });
  }

  if (error instanceof HttpError) {
    return fastifyErrorResponse({
      reply,
      ...error,
    });
  }

  if (error instanceof ApplicationError) {
    return fastifyErrorResponse({
      reply,
      statusCode: error.statusCode ?? 400,
      code: error.code,
      message: error.message,
    });
  }

  if ((error as FastifyError).code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
    return fastifyErrorResponse({
      reply,
      statusCode: 400,
      code: ErrorCode.VALIDATION,
      message: [
        {
          field: 'body',
          message: 'Malformed JSON body',
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.error(error);

  return fastifyErrorResponse({
    reply,
    statusCode: 500,
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'Internal Server Error',
  });
});
