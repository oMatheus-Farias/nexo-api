import { RefreshTokenUseCase } from '@application/usecases/auth/RefreshTokenUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';
import { Schema } from '@kermel/decorators/Schema';

import { type RefreshTokenBody, refreshTokenSchema } from './schemas/refreshTokenSchema';

@Injectable()
@Schema(refreshTokenSchema)
export class RefreshTokenController extends Controller<'public', RefreshTokenController.Response> {
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
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  }
}

export namespace RefreshTokenController {
  export type Response = {
    access_token: string;
    refresh_token: string;
  };
}
