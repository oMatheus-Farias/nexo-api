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

  async execute(userId: string): Promise<GithubAppGateway.SelectedRepository[]> {
    const integration = await this.integrationRepository.findByUserIdAndProvider(userId, 'GITHUB');

    if (!integration || !integration.installationId) {
      throw new NotFound('GitHub Integration or App Installation not found for this user.');
    }

    const repositories = await this.githubAppGateway.getInstallationRepositories(
      integration.installationId,
    );

    const syncedRepositories: GithubAppGateway.SelectedRepository[] = [];

    for (const repository of repositories) {
      const syncedRepository = await this.repositoryRepository.upsertByIntegrationAndExternalId({
        integrationId: integration.id,
        externalRepoId: repository.id.toString(),
        name: repository.name,
        fullName: repository.full_name,
        isPrivate: repository.private,
      });

      syncedRepositories.push({
        id: repository.id.toString(),
        name: syncedRepository.name,
        fullName: syncedRepository.fullName,
        owner: repository.owner.login,
        isPrivate: syncedRepository.isPrivate,
        htmlUrl: repository.html_url,
      });
    }

    return syncedRepositories;
  }
}
