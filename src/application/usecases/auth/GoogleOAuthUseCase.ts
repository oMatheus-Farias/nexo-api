import { Injectable } from '@kermel/decorators/Injectable';
import { env } from '@shared/config/env';

@Injectable()
export class GoogleOAuthUseCase {
  async execute(): Promise<GoogleOAuthUseCase.Output> {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'profile email',
      access_type: 'offline',
      prompt: 'consent',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return {
      googleAuthUrl,
    };
  }
}

export namespace GoogleOAuthUseCase {
  export type Output = {
    googleAuthUrl: string;
  };
}
