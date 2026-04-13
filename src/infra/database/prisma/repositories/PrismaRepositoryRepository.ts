import { prismaClient } from '@infra/clients/prismaClient';
import type { Repository } from '@infra/prisma/generated/prisma/client';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class PrismaRepositoryRepository {
  async upsertByIntegrationAndExternalId(input: {
    integrationId: string;
    externalRepoId: string;
    name: string;
    fullName: string;
    isPrivate: boolean;
  }): Promise<Repository> {
    return prismaClient.repository.upsert({
      where: {
        integrationId_externalRepoId: {
          integrationId: input.integrationId,
          externalRepoId: input.externalRepoId,
        },
      },
      create: {
        integrationId: input.integrationId,
        externalRepoId: input.externalRepoId,
        name: input.name,
        fullName: input.fullName,
        isPrivate: input.isPrivate,
      },
      update: {
        name: input.name,
        fullName: input.fullName,
        isPrivate: input.isPrivate,
      },
    });
  }
}
