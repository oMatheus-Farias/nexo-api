import { GithubCallbackUseCase } from '@application/usecases/auth/GithubCallbackUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';
import { env } from '@shared/config/env';

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

    const redirectUrl = `${env.FRONTEND_URL}/auth/github/callback?token=${accessToken}&refreshToken=${refreshToken}`;

    return {
      statusCode: 302,
      body: {
        redirect_url: redirectUrl,
      },
    };
  }
}

export namespace GithubCallbackController {
  export type Response = {
    redirect_url: string;
  };
}
