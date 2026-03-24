import { NotFound } from '@application/errors/http/NotFound';
import { prismaClient } from '@infra/clients/prismaClient';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class GetMeQuery {
  async execute(input: GetMeQuery.Input): Promise<GetMeQuery.Output> {
    const data = await prismaClient.user.findUnique({
      where: {
        id: input.userId,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        integrations: {
          select: {
            provider: true,
            installationId: true,
          },
        },
      },
    });

    if (!data) {
      throw new NotFound('User not found');
    }

    const githubIntegration = data.integrations.find((i) => i.provider === 'GITHUB');
    const isGithubAppInstalled = !!(githubIntegration && githubIntegration.installationId);

    return {
      id: data.id,
      name: data.name,
      avatarUrl: data.avatarUrl,
      isGithubAppInstalled,
    };
  }
}

export namespace GetMeQuery {
  export type Input = {
    userId: string;
  };

  export type Output = {
    id: string;
    name: string;
    avatarUrl: string | null;
    isGithubAppInstalled: boolean;
  };
}
