import { RefreshToken } from '@application/entities/RefreshToken';
import { NotFound } from '@application/errors/http/NotFound';
import { Unauthorized } from '@application/errors/http/Unauthorized';
import { RefreshTokenRepository } from '@infra/database/prisma/repositories/RefreshTokenRepository';
import { UserRepository } from '@infra/database/prisma/repositories/UserRepository';
import { JwtTokenGateway } from '@infra/gateways/JwtTokenGateway';
import { Injectable } from '@kermel/decorators/Injectable';
import { EXP_TIME_IN_HOURS } from '@shared/constants/expireInTimes';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly jwtTokenGateway: JwtTokenGateway,
  ) {}

  async execute({
    refreshTokenId,
  }: RefreshTokenUseCase.Input): Promise<RefreshTokenUseCase.Output> {
    const existingRefreshToken = await this.refreshTokenRepository.findById(refreshTokenId);

    if (!existingRefreshToken) {
      throw new NotFound('Refresh token not found');
    }

    if (Date.now() > existingRefreshToken.expiresAt.getTime()) {
      await this.refreshTokenRepository.deleteAllByUserId(existingRefreshToken.userId);
      throw new Unauthorized('Refresh token has expired');
    }
    await this.refreshTokenRepository.deleteAllByUserId(existingRefreshToken.userId);

    const user = await this.userRepository.findById(existingRefreshToken.userId);

    if (!user) {
      throw new NotFound('User not found');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + EXP_TIME_IN_HOURS);

    const refreshTokenEntity = RefreshToken.create({
      userId: user.id,
      expiresAt,
    });

    await this.refreshTokenRepository.create(refreshTokenEntity);

    const accessToken = this.jwtTokenGateway.sign(user.id);
    const refreshToken = refreshTokenEntity.id;

    return {
      accessToken,
      refreshToken,
    };
  }
}

export namespace RefreshTokenUseCase {
  export type Input = {
    refreshTokenId: string;
  };

  export type Output = {
    accessToken: string;
    refreshToken: string;
  };
}
