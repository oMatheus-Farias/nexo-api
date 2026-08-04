import { NotFound } from '@application/errors/http/NotFound';
import { PrismaIntegrationRepository } from '@infra/database/prisma/repositories/PrismaIntegrationRepository';
import { PrismaRepositoryRepository } from '@infra/database/prisma/repositories/PrismaRepositoryRepository';
import { GithubAppGateway } from '@infra/gateways/github/GithubAppGateway';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class SyncGithubRepositoriesUseCase {
  constructor(
    private readonly integrationRepository: PrismaIntegrationRepository,
    private readonly repositoryRepository: PrismaRepositoryRepository,
    private readonly githubAppGateway: GithubAppGateway,
  ) {}

  async execute(
    userId: string,
    options?: SyncGithubRepositoriesUseCase.Input,
  ): Promise<GithubAppGateway.SelectedRepository[]> {
    const integration = await this.integrationRepository.findByUserIdAndProvider(userId, 'GITHUB');

    if (!integration || !integration.installationId) {
      throw new NotFound('GitHub Integration or App Installation not found for this user.');
    }

    const installationRepositories = await this.githubAppGateway.getInstallationRepositories(
      integration.installationId,
    );
    const now = new Date();
    const remoteRepositories = new Map(
      installationRepositories.map((repository) => [repository.id.toString(), repository]),
    );
    const localRepositories = await this.repositoryRepository.findManyByIntegrationId(
      integration.id,
    );
    const localRepositoriesByExternalId = new Map(
      localRepositories.map((repository) => [repository.externalRepoId, repository]),
    );
    const targetLocalRepositories = options?.repositoryId
      ? localRepositories.filter((repository) => repository.id === options.repositoryId)
      : localRepositories;
    const syncedRepositories: GithubAppGateway.SelectedRepository[] = [];

    for (const localRepository of targetLocalRepositories) {
      const remoteRepository = remoteRepositories.get(localRepository.externalRepoId);

      if (!remoteRepository) {
        if (localRepository.isEnabled) {
          await this.repositoryRepository.updateById(localRepository.id, {
            syncStatus: 'DISCONNECTED',
            lastSyncAttemptAt: now,
            lastSyncError: null,
            disconnectedAt: now,
          });
        }

        continue;
      }

      const syncStatus = localRepository.isEnabled ? 'SYNCED' : 'PAUSED';

      const syncedRepository = await this.repositoryRepository.upsertByIntegrationAndExternalId({
        integrationId: integration.id,
        externalRepoId: remoteRepository.id.toString(),
        name: remoteRepository.name,
        fullName: remoteRepository.full_name,
        isPrivate: remoteRepository.private,
        syncStatus,
        isEnabled: localRepository.isEnabled,
        lastSyncedAt: syncStatus === 'SYNCED' ? now : localRepository.lastSyncedAt,
        lastSyncAttemptAt: now,
        lastSyncError: null,
        disconnectedAt: syncStatus === 'SYNCED' ? null : localRepository.disconnectedAt,
      });

      syncedRepositories.push({
        id: remoteRepository.id.toString(),
        name: syncedRepository.name,
        fullName: syncedRepository.fullName,
        owner: remoteRepository.owner.login,
        isPrivate: syncedRepository.isPrivate,
        htmlUrl: remoteRepository.html_url,
      });
    }

    if (options?.createMissingRepositories) {
      for (const remoteRepository of installationRepositories) {
        if (localRepositoriesByExternalId.has(remoteRepository.id.toString())) {
          continue;
        }

        const syncedRepository = await this.repositoryRepository.upsertByIntegrationAndExternalId({
          integrationId: integration.id,
          externalRepoId: remoteRepository.id.toString(),
          name: remoteRepository.name,
          fullName: remoteRepository.full_name,
          isPrivate: remoteRepository.private,
          syncStatus: 'SYNCED',
          isEnabled: true,
          lastSyncedAt: now,
          lastSyncAttemptAt: now,
          lastSyncError: null,
          disconnectedAt: null,
        });

        syncedRepositories.push({
          id: remoteRepository.id.toString(),
          name: syncedRepository.name,
          fullName: syncedRepository.fullName,
          owner: remoteRepository.owner.login,
          isPrivate: syncedRepository.isPrivate,
          htmlUrl: remoteRepository.html_url,
        });
      }
    }

    return syncedRepositories;
  }
}

export namespace SyncGithubRepositoriesUseCase {
  export type Input = {
    createMissingRepositories?: boolean;
    repositoryId?: string;
  };
}
