import { GoogleOAuthUseCase } from '@application/usecases/auth/GoogleOAuthUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class GoogleOAuthController extends Controller<'public', GoogleOAuthController.Response> {
  constructor(private readonly googleOAuthUseCase: GoogleOAuthUseCase) {
    super();
  }

  protected override async handle(): Promise<Controller.Response<GoogleOAuthController.Response>> {
    const { googleAuthUrl } = await this.googleOAuthUseCase.execute();

    return {
      statusCode: 200,
      body: {
        auth_url: googleAuthUrl,
        message: 'Redirect to this URL to authenticate with Google',
      },
    };
  }
}

export namespace GoogleOAuthController {
  export type Response = {
    auth_url: string;
    message: string;
  };
}
