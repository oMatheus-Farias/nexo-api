import { RefreshToken } from '@application/entities/RefreshToken';
import { User } from '@application/entities/User';
import { NotFound } from '@application/errors/http/NotFound';
import { Unauthorized } from '@application/errors/http/Unauthorized';
import { RefreshTokenRepository } from '@infra/database/prisma/repositories/RefreshTokenRepository';
import { UserRepository } from '@infra/database/prisma/repositories/UserRepository';
import { JwtTokenGateway } from '@infra/gateways/JwtTokenGateway';
import { Injectable } from '@kermel/decorators/Injectable';
import { env } from '@shared/config/env';
import { EXP_TIME_IN_HOURS } from '@shared/constants/expireInTimes';

@Injectable()
export class GoogleCallbackUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtTokenGateway: JwtTokenGateway,
  ) {}

  async execute(input: GoogleCallbackUseCase.Input): Promise<GoogleCallbackUseCase.Output> {
    if (!input.code || typeof input.code !== 'string') {
      throw new Unauthorized('Authorization code is required');
    }

    // 1. Trocar código por access token
    const tokenResponse = await this.exchangeCodeForToken({
      code: input.code,
    });

    // 2. Buscar dados do usuário no Google
    const googleUser = await this.fetchGoogleUser({
      accessToken: tokenResponse.access_token,
    });

    // 3. Verificar se conta já existe com Google ID
    const user = await this.userRepository.findByGoogleId(googleUser.id);

    if (user) {
      await this.userRepository.updateGoogleIdAndAvatar({
        userId: user.id,
        googleId: googleUser.id,
        avatarUrl: googleUser.picture,
        name: googleUser.name,
      });

      const accessToken = this.jwtTokenGateway.sign(user.id);
      const refreshToken = await this.createRefreshToken(user.id);

      return {
        accessToken,
        refreshToken,
      };
    }

    // 4. Verificar se já existe conta com o mesmo email
    const existingUser = await this.userRepository.findByEmail(googleUser.email);
    if (existingUser) {
      await this.userRepository.updateGoogleIdAndAvatar({
        userId: existingUser.id,
        googleId: googleUser.id,
        avatarUrl: googleUser.picture,
        name: googleUser.name,
      });

      const accessToken = this.jwtTokenGateway.sign(existingUser.id);
      const refreshToken = await this.createRefreshToken(existingUser.id);

      return {
        accessToken,
        refreshToken,
      };
    }

    // 5. Criar nova conta
    const userEntity = User.create({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.id,
      avatarUrl: googleUser.picture,
    });

    const newUser = await this.userRepository.create({
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
      googleId: userEntity.googleId ?? null,
      avatarUrl: userEntity.avatarUrl ?? null,
      githubId: null,
    });

    const accessToken = this.jwtTokenGateway.sign(newUser.id);
    const refreshToken = await this.createRefreshToken(newUser.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EXP_TIME_IN_HOURS);

    const refreshTokenEntity = RefreshToken.create({
      userId,
      expiresAt,
    });

    const { id: refreshTokenId } = await this.refreshTokenRepository.create(refreshTokenEntity);
    return refreshTokenId;
  }

  private async exchangeCodeForToken(
    input: GoogleTokenResponse.Input,
  ): Promise<GoogleTokenResponse.Output> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code: input.code,
        grant_type: 'authorization_code',
        redirect_uri: env.GOOGLE_CALLBACK_URL,
      }),
    });

    if (!response.ok) {
      throw new NotFound('Failed to exchange code for token');
    }

    return response.json();
  }

  private async fetchGoogleUser(input: GoogleUserInfo.Input): Promise<GoogleUserInfo.Output> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new NotFound('Failed to fetch user info from Google');
    }

    return response.json();
  }
}

export namespace GoogleTokenResponse {
  export type Input = {
    code: string;
  };

  export type Output = {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    refresh_token?: string;
  };
}

export namespace GoogleUserInfo {
  export type Input = {
    accessToken: string;
  };

  export type Output = {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
  };
}

export namespace GoogleCallbackUseCase {
  export type Input = {
    code: string | undefined;
  };

  export type Output = {
    accessToken: string;
    refreshToken: string;
  };
}
