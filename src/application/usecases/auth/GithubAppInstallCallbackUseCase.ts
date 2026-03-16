import { Conflict } from '@application/errors/http/Conflict';

import type { IntegrationRepository } from '../../../domain/contracts/repositories/IntegrationRepository';
import { IUserRepository } from '../../../domain/contracts/repositories/UserRepository';
import type { IGithubAppGateway } from '../../../infra/gateways/github/GithubAppGateway';
import { Injectable } from '../../../kermel/decorators/Injectable';

@Injectable()
export class GithubAppInstallCallbackUseCase {
  constructor(
    private readonly integrationRepository: IntegrationRepository,
    private readonly userRepository: IUserRepository,
    private readonly githubAppGateway: IGithubAppGateway,
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
  }
}

export namespace GithubAppInstallCallbackUseCase {
  export type Input = {
    installationId: string;
    setupAction?: string;
  };
}
