import type { RefreshToken } from '@application/entities/RefreshToken';

export abstract class IRefreshTokenRepository {
  abstract findById(refreshTokenId: string): Promise<RefreshToken | null>;
  abstract findAllByUserId(userId: string): Promise<RefreshToken[] | []>;
  abstract create(data: RefreshToken): Promise<Pick<RefreshToken, 'id'>>;
  abstract delete(refreshTokenId: string): Promise<void>;
  abstract deleteAllByUserId(userId: string): Promise<void>;
}
