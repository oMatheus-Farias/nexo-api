import { Injectable } from '@kermel/decorators/Injectable';
import { env } from '@shared/config/env';

@Injectable()
export class GithubOAuthUseCase {
  async execute(): Promise<GithubOAuthUseCase.Output> {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: 'read:user user:email',
    });

    const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    return {
      githubAuthUrl,
    };
  }
}

export namespace GithubOAuthUseCase {
  export type Output = {
    githubAuthUrl: string;
  };
}
