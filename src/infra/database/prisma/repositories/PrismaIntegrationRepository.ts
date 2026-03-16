import { IntegrationRepository } from '@domain/contracts/repositories/IntegrationRepository';
import { prismaClient } from '@infra/clients/prismaClient';
import type { Integration } from '@infra/prisma/generated/prisma/client';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class PrismaIntegrationRepository implements IntegrationRepository {
  async findByUserIdAndProvider(
    userId: string,
    provider: 'GITHUB' | 'JIRA' | 'PLANNER',
  ): Promise<Integration | null> {
    return prismaClient.integration.findFirst({
      where: { userId, provider },
    });
  }

  async createOrUpdate(data: {
    userId: string;
    externalUserId: string;
    provider: 'GITHUB' | 'JIRA' | 'PLANNER';
    accessTokenEncrypted: string;
    refreshTokenEncrypted?: string;
    scopes?: string;
    installationId?: string;
  }): Promise<Integration> {
    const existing = await prismaClient.integration.findFirst({
      where: { userId: data.userId, provider: data.provider },
    });

    if (existing) {
      return prismaClient.integration.update({
        where: { id: existing.id },
        data: {
          externalUserId: data.externalUserId,
          accessTokenEncrypted: data.accessTokenEncrypted,
          refreshTokenEncrypted: data.refreshTokenEncrypted ?? '',
          scopes: data.scopes ?? '',
          installationId: data.installationId ?? '',
        },
      });
    }

    return prismaClient.integration.create({
      data,
    });
  }
}
