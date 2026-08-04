import { NotFound } from '@application/errors/http/NotFound';
import { PrismaIntegrationRepository } from '@infra/database/prisma/repositories/PrismaIntegrationRepository';
import { PrismaRepositoryRepository } from '@infra/database/prisma/repositories/PrismaRepositoryRepository';
import { GithubAppGateway } from '@infra/gateways/github/GithubAppGateway';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class AddGithubRepositoriesUseCase {
  constructor(
    private readonly integrationRepository: PrismaIntegrationRepository,
    private readonly repositoryRepository: PrismaRepositoryRepository,
    private readonly githubAppGateway: GithubAppGateway,
  ) {}

  async execute(
    input: AddGithubRepositoriesUseCase.Input,
  ): Promise<AddGithubRepositoriesUseCase.Output> {
    const integration = await this.integrationRepository.findByUserIdAndProvider(
      input.userId,
      'GITHUB',
    );

    if (!integration || !integration.installationId) {
      throw new NotFound('GitHub Integration or App Installation not found for this user.');
    }

    const installationRepositories = await this.githubAppGateway.getInstallationRepositories(
      integration.installationId,
    );
    const now = new Date();
    const selectedRepositoryIds = new Set(input.externalRepoIds);
    const selectedRepositories = installationRepositories.filter((repository) =>
      selectedRepositoryIds.has(repository.id.toString()),
    );

    if (selectedRepositories.length !== input.externalRepoIds.length) {
      throw new NotFound(
        'One or more selected repositories were not found in the GitHub installation.',
      );
    }

    const addedRepositories: GithubAppGateway.SelectedRepository[] = [];

    for (const repository of selectedRepositories) {
      const syncedRepository = await this.repositoryRepository.upsertByIntegrationAndExternalId({
        integrationId: integration.id,
        externalRepoId: repository.id.toString(),
        name: repository.name,
        fullName: repository.full_name,
        isPrivate: repository.private,
        syncStatus: 'SYNCED',
        isEnabled: true,
        lastSyncedAt: now,
        lastSyncAttemptAt: now,
        lastSyncError: null,
        disconnectedAt: null,
      });

      addedRepositories.push({
        id: repository.id.toString(),
        name: syncedRepository.name,
        fullName: syncedRepository.fullName,
        owner: repository.owner.login,
        isPrivate: syncedRepository.isPrivate,
        htmlUrl: repository.html_url,
      });
    }

    return addedRepositories;
  }
}

export namespace AddGithubRepositoriesUseCase {
  export type Input = {
    userId: string;
    externalRepoIds: string[];
  };

  export type Output = GithubAppGateway.SelectedRepository[];
}
