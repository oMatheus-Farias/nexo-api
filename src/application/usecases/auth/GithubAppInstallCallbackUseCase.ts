import { Conflict } from '@application/errors/http/Conflict';
import { SyncGithubRepositoriesUseCase } from '@application/usecases/github/SyncGithubRepositoriesUseCase';
import { PrismaIntegrationRepository } from '@infra/database/prisma/repositories/PrismaIntegrationRepository';
import { UserRepository } from '@infra/database/prisma/repositories/UserRepository';
import { GithubAppGateway } from '@infra/gateways/github/GithubAppGateway';

import { Injectable } from '../../../kermel/decorators/Injectable';

@Injectable()
export class GithubAppInstallCallbackUseCase {
  constructor(
    private readonly integrationRepository: PrismaIntegrationRepository,
    private readonly userRepository: UserRepository,
    private readonly githubAppGateway: GithubAppGateway,
    private readonly syncGithubRepositoriesUseCase: SyncGithubRepositoriesUseCase,
  ) {}

  async execute({
    installationId,
    setupAction,
  }: GithubAppInstallCallbackUseCase.Input): Promise<void> {
    if (setupAction && setupAction !== 'install' && setupAction !== 'update') {
      return;
    }

    const { githubUserId } = await this.githubAppGateway.getInstallationDetails(installationId);

    const user = await this.userRepository.findByGithubId(githubUserId);

    if (!user) {
      throw new Conflict('USER_NOT_LINKED_TO_GITHUB');
    }

    const existing = await this.integrationRepository.findByUserIdAndProvider(user.id, 'GITHUB');

    await this.integrationRepository.createOrUpdate({
      userId: user.id,
      provider: 'GITHUB',
      externalUserId: githubUserId,
      accessTokenEncrypted: existing ? existing.accessTokenEncrypted : 'none',
      installationId,
      scopes: existing?.scopes as string,
    });

    await this.syncGithubRepositoriesUseCase.execute(user.id, {
      createMissingRepositories: true,
    });
  }
}

export namespace GithubAppInstallCallbackUseCase {
  export type Input = {
    installationId: string;
    setupAction?: string;
  };
}
