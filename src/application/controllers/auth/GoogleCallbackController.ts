import { GoogleCallbackUseCase } from '@application/usecases/auth/GoogleCallbackUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';
import { env } from '@shared/config/env';

@Injectable()
export class GoogleCallbackController extends Controller<
  'public',
  GoogleCallbackController.Response
> {
  constructor(private readonly googleCallbackUseCase: GoogleCallbackUseCase) {
    super();
  }

  protected override async handle({
    queryParams,
  }: Controller.Request<'public'>): Promise<
    Controller.Response<GoogleCallbackController.Response>
  > {
    const { code } = queryParams as { code?: string };

    const { accessToken, refreshToken } = await this.googleCallbackUseCase.execute({ code });

    // Login bem-sucedido - redirecionar com tokens
    const redirectUrl = `${env.FRONTEND_URL}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl,
      },
      body: {
        redirect_url: redirectUrl,
      },
    };
  }
}

export namespace GoogleCallbackController {
  export type Response = {
    redirect_url: string;
  };
}
