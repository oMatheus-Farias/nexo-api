import { PrismaIntegrationRepository } from '@infra/database/prisma/repositories/PrismaIntegrationRepository';
import { PrismaRepositoryRepository } from '@infra/database/prisma/repositories/PrismaRepositoryRepository';
import { GithubAppGateway } from '@infra/gateways/github/GithubAppGateway';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class DiscoverGithubRepositoriesUseCase {
  constructor(
    private readonly integrationRepository: PrismaIntegrationRepository,
    private readonly repositoryRepository: PrismaRepositoryRepository,
    private readonly githubAppGateway: GithubAppGateway,
  ) {}

  async execute(userId: string): Promise<DiscoverGithubRepositoriesUseCase.Output> {
    const integration = await this.integrationRepository.findByUserIdAndProvider(userId, 'GITHUB');

    if (!integration || !integration.installationId) {
      return [];
    }

    const [installationRepositories, localRepositories] = await Promise.all([
      this.githubAppGateway.getInstallationRepositories(integration.installationId),
      this.repositoryRepository.findManyByIntegrationId(integration.id),
    ]);

    const localRepositoriesByExternalId = new Map(
      localRepositories.map((repository) => [repository.externalRepoId, repository]),
    );

    return installationRepositories.map((repository) => {
      const localRepository = localRepositoriesByExternalId.get(repository.id.toString());

      return {
        external_repo_id: repository.id.toString(),
        name: repository.name,
        full_name: repository.full_name,
        owner: repository.owner.login,
        is_private: repository.private,
        html_url: repository.html_url,
        local_repository_id: localRepository?.id ?? null,
        sync_status: localRepository?.syncStatus ?? 'PENDING',
        is_enabled: localRepository?.isEnabled ?? false,
        last_synced_at: localRepository?.lastSyncedAt ?? null,
        last_sync_attempt_at: localRepository?.lastSyncAttemptAt ?? null,
        last_sync_error: localRepository?.lastSyncError ?? null,
        disconnected_at: localRepository?.disconnectedAt ?? null,
      };
    });
  }
}

export namespace DiscoverGithubRepositoriesUseCase {
  export type Output = Array<{
    external_repo_id: string;
    name: string;
    full_name: string;
    owner: string;
    is_private: boolean;
    html_url: string;
    local_repository_id: string | null;
    sync_status: 'SYNCED' | 'PENDING' | 'DISCONNECTED' | 'PAUSED' | 'ERROR';
    is_enabled: boolean;
    last_synced_at: Date | null;
    last_sync_attempt_at: Date | null;
    last_sync_error: string | null;
    disconnected_at: Date | null;
  }>;
}
