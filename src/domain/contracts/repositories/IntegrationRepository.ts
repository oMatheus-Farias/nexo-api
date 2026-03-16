import type { Integration } from '@infra/prisma/generated/prisma/client';

export abstract class IntegrationRepository {
  abstract findByUserIdAndProvider(
    userId: string,
    provider: 'GITHUB' | 'JIRA' | 'PLANNER',
  ): Promise<Integration | null>;

  abstract createOrUpdate(data: {
    userId: string;
    externalUserId: string;
    provider: 'GITHUB' | 'JIRA' | 'PLANNER';
    accessTokenEncrypted: string;
    refreshTokenEncrypted?: string;
    scopes?: string;
    installationId?: string;
  }): Promise<Integration>;
}
