import type { IntegrationRepository } from '../../../domain/contracts/repositories/IntegrationRepository';
import type { IGithubAppGateway } from '../../../infra/gateways/github/GithubAppGateway';
import { Injectable } from '../../../kermel/decorators/Injectable';
import { NotFound } from '../../errors/http/NotFound';

@Injectable()
export class ListGithubRepositoriesUseCase {
  constructor(
    private readonly integrationRepository: IntegrationRepository,
    private readonly githubAppGateway: IGithubAppGateway,
  ) {}

  async execute(userId: string): Promise<any[]> {
    const integration = await this.integrationRepository.findByUserIdAndProvider(userId, 'GITHUB');

    if (!integration || !integration.installationId) {
      throw new NotFound('GitHub Integration or App Installation not found for this user.');
    }

    const repositories = await this.githubAppGateway.getInstallationRepositories(
      integration.installationId,
    );

    return repositories;
  }
}
