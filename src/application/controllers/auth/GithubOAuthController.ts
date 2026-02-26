import { GithubOAuthUseCase } from '@application/usecases/auth/GithubOAuthUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class GithubOAuthController extends Controller<'public', GithubOAuthController.Response> {
  constructor(private readonly githubOAuthUseCase: GithubOAuthUseCase) {
    super();
  }

  protected override async handle(): Promise<Controller.Response<GithubOAuthController.Response>> {
    const { githubAuthUrl } = await this.githubOAuthUseCase.execute();

    return {
      statusCode: 200,
      body: {
        auth_url: githubAuthUrl,
        message: 'Redirect to this URL to authenticate with GitHub',
      },
    };
  }
}

export namespace GithubOAuthController {
  export type Response = {
    auth_url: string;
    message: string;
  };
}
