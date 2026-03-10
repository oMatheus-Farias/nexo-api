import { RefreshTokenUseCase } from '@application/usecases/auth/RefreshTokenUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';
import { Schema } from '@kermel/decorators/Schema';
import { Encryption } from '@shared/utils/Encryption';

import { type RefreshTokenBody, refreshTokenSchema } from './schemas/refreshTokenSchema';

@Injectable()
@Schema(refreshTokenSchema)
export class RefreshTokenController extends Controller<'public', RefreshTokenBody> {
  constructor(private readonly refreshTokenUseCase: RefreshTokenUseCase) {
    super();
  }

  protected override async handle({
    body,
  }: Controller.Request<'public', RefreshTokenBody>): Promise<
    Controller.Response<RefreshTokenController.Response>
  > {
    const { refresh_token } = body;

    const { accessToken, refreshToken } = await this.refreshTokenUseCase.execute({
      refreshTokenId: refresh_token,
    });

    return {
      statusCode: 201,
      body: {
        refresh_token: refreshToken,
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

export namespace RefreshTokenController {
  export type Response = {
    refresh_token: string;
  };
}
