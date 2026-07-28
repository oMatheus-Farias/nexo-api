import { GithubCallbackUseCase } from '@application/usecases/auth/GithubCallbackUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';
import { env } from '@shared/config/env';
import { Encryption } from '@shared/utils/Encryption';

@Injectable()
export class GithubCallbackController extends Controller<
  'public',
  GithubCallbackController.Response
> {
  constructor(private readonly githubCallbackUseCase: GithubCallbackUseCase) {
    super();
  }

  protected override async handle({
    queryParams,
  }: Controller.Request<'public'>): Promise<
    Controller.Response<GithubCallbackController.Response>
  > {
    const { code } = queryParams as { code?: string };

    const { accessToken, refreshToken } = await this.githubCallbackUseCase.execute({ code });

    console.log('Access Token:', JSON.stringify(accessToken, null, 2));

    const redirectUrl = `${env.FRONTEND_URL}/auth/github/callback?refreshToken=${refreshToken}`;

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl,
      },
      body: {
        redirect_url: redirectUrl,
      },
      cookies: [
        {
          name: 'nexo-access-token',
          value: Encryption.encrypt(accessToken),
          options: {
            path: '/',
            secure: true,
            sameSite: 'lax',
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60, // 7 days
          },
        },
      ],
    };
  }
}

export namespace GithubCallbackController {
  export type Response = {
    redirect_url: string;
  };
}
