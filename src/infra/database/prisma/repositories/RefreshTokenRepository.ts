import type { RefreshToken } from '@application/entities/RefreshToken';
import type { IRefreshTokenRepository } from '@domain/contracts/repositories/RefreshTokenRepository';
import { prismaClient } from '@infra/clients/prismaClient';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  async findById(refreshTokenId: string): Promise<RefreshToken | null> {
    const refreshToken = await prismaClient.refreshToken.findUnique({
      where: { id: refreshTokenId },
    });

    if (!refreshToken) {
      return null;
    }

    return refreshToken;
  }

  async findAllByUserId(userId: string): Promise<RefreshToken[] | []> {
    const refreshTokens = await prismaClient.refreshToken.findMany({
      where: { userId },
    });

    return refreshTokens;
  }

  async create(data: RefreshToken): Promise<Pick<RefreshToken, 'id'>> {
    const refreshToken = await prismaClient.refreshToken.create({
      data,
      select: { id: true },
    });

    return { id: refreshToken.id };
  }

  async delete(refreshTokenId: string): Promise<void> {
    await prismaClient.refreshToken.delete({
      where: { id: refreshTokenId },
    });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await prismaClient.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
