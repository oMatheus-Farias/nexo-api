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
export class GithubCallbackUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtTokenGateway: JwtTokenGateway,
  ) {}

  async execute(input: GithubCallbackUseCase.Input): Promise<GithubCallbackUseCase.Output> {
    if (!input.code || typeof input.code !== 'string') {
      throw new Unauthorized('Authorization code is required');
    }

    // 1. Exchange code for access token
    const tokenResponse = await this.exchangeCodeForToken({
      code: input.code,
    });

    // 2. Fetch user data from GitHub
    const githubUser = await this.fetchGithubUser({
      accessToken: tokenResponse.access_token,
    });

    const githubUserId = githubUser.id.toString();

    let email: string | null | undefined = githubUser.email;

    if (!email) {
      email = await this.fetchGithubUserEmail({ accessToken: tokenResponse.access_token });
    }

    if (!email) {
      throw new Unauthorized('Could not retrieve email from GitHub account');
    }

    // 3. Check if user exists with GitHub ID
    const user = await this.userRepository.findByGithubId(githubUserId);

    if (user) {
      await this.userRepository.updateGithubIdAndAvatar({
        userId: user.id,
        githubId: githubUserId,
        avatarUrl: githubUser.avatar_url,
        name: user.name,
      });

      const accessToken = this.jwtTokenGateway.sign(user.id);
      const refreshToken = await this.createRefreshToken(user.id);

      return {
        accessToken,
        refreshToken,
      };
    }

    // 4. Check if user exists with same email
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      await this.userRepository.updateGithubIdAndAvatar({
        userId: existingUser.id,
        githubId: githubUserId,
        avatarUrl: githubUser.avatar_url,
        name: existingUser.name,
      });

      const accessToken = this.jwtTokenGateway.sign(existingUser.id);
      const refreshToken = await this.createRefreshToken(existingUser.id);

      return {
        accessToken,
        refreshToken,
      };
    }

    // 5. Create new account
    const userEntity = User.create({
      email: email,
      name: githubUser.name || githubUser.login,
      githubId: githubUserId,
      avatarUrl: githubUser.avatar_url,
    });

    const newUser = await this.userRepository.create({
      id: userEntity.id,
      email: userEntity.email,
      name: userEntity.name,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
      githubId: userEntity.githubId ?? null,
      avatarUrl: userEntity.avatarUrl ?? null,
      googleId: null,
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
    input: GithubTokenResponse.Input,
  ): Promise<GithubTokenResponse.Output> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: input.code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
      }),
    });

    if (!response.ok) {
      throw new NotFound('Failed to exchange code for token');
    }

    const data = await response.json();

    if ((data as any).error) {
      throw new Unauthorized(
        `GitHub OAuth Error: ${(data as any).error_description || (data as any).error}`,
      );
    }

    return data as GithubTokenResponse.Output;
  }

  private async fetchGithubUser(input: GithubUserInfo.Input): Promise<GithubUserInfo.Output> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new NotFound('Failed to fetch user info from GitHub');
    }

    return response.json() as Promise<GithubUserInfo.Output>;
  }

  private async fetchGithubUserEmail(input: { accessToken: string }): Promise<string | undefined> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const emails = (await response.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;

    // Prefer primary and verified, but if not found, take first verified.
    const primaryEmail = emails.find((e) => e.primary && e.verified);
    if (primaryEmail) {
      return primaryEmail.email;
    }

    const verifiedEmail = emails.find((e) => e.verified);
    if (verifiedEmail) {
      return verifiedEmail.email;
    }

    return undefined;
  }
}

export namespace GithubTokenResponse {
  export type Input = {
    code: string;
  };

  export type Output = {
    access_token: string;
    expires_in?: number;
    token_type: string;
    scope: string;
    refresh_token?: string;
  };
}

export namespace GithubUserInfo {
  export type Input = {
    accessToken: string;
  };

  export type Output = {
    id: number;
    email: string | null;
    name: string | null;
    login: string;
    avatar_url: string;
  };
}

export namespace GithubCallbackUseCase {
  export type Input = {
    code: string | undefined;
  };

  export type Output = {
    accessToken: string;
    refreshToken: string;
  };
}
