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
    syncStatus?: Repository['syncStatus'];
    isEnabled?: boolean;
    lastSyncedAt?: Date | null;
    lastSyncAttemptAt?: Date | null;
    lastSyncError?: string | null;
    disconnectedAt?: Date | null;
  }): Promise<Repository> {
    const syncFields = {
      ...(input.syncStatus !== undefined ? { syncStatus: input.syncStatus } : {}),
      ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
      ...(input.lastSyncedAt !== undefined ? { lastSyncedAt: input.lastSyncedAt } : {}),
      ...(input.lastSyncAttemptAt !== undefined
        ? { lastSyncAttemptAt: input.lastSyncAttemptAt }
        : {}),
      ...(input.lastSyncError !== undefined ? { lastSyncError: input.lastSyncError } : {}),
      ...(input.disconnectedAt !== undefined ? { disconnectedAt: input.disconnectedAt } : {}),
    };

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
        syncStatus: input.syncStatus ?? 'PENDING',
        isEnabled: input.isEnabled ?? true,
        lastSyncedAt: input.lastSyncedAt ?? null,
        lastSyncAttemptAt: input.lastSyncAttemptAt ?? null,
        lastSyncError: input.lastSyncError ?? null,
        disconnectedAt: input.disconnectedAt ?? null,
      },
      update: {
        name: input.name,
        fullName: input.fullName,
        isPrivate: input.isPrivate,
        ...syncFields,
      },
    });
  }

  async findManyByIntegrationId(integrationId: string) {
    return prismaClient.repository.findMany({
      where: { integrationId },
      orderBy: { name: 'asc' },
    });
  }

  async findByIntegrationIdAndExternalRepoId(
    integrationId: string,
    externalRepoId: string,
  ): Promise<Repository | null> {
    return prismaClient.repository.findUnique({
      where: {
        integrationId_externalRepoId: {
          integrationId,
          externalRepoId,
        },
      },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Repository | null> {
    return prismaClient.repository.findFirst({
      where: {
        id,
        integration: {
          userId,
        },
      },
    });
  }

  async updateById(
    id: string,
    data: Partial<{
      syncStatus: Repository['syncStatus'];
      isEnabled: boolean;
      lastSyncedAt: Date | null;
      lastSyncAttemptAt: Date | null;
      lastSyncError: string | null;
      disconnectedAt: Date | null;
      name: string;
      fullName: string;
      isPrivate: boolean;
    }>,
  ): Promise<Repository> {
    return prismaClient.repository.update({
      where: { id },
      data,
    });
  }

  async findByIntegrationId(integrationId: string): Promise<Repository[]> {
    return prismaClient.repository.findMany({
      where: { integrationId },
    });
  }
}
