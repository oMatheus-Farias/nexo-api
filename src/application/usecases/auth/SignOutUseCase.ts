import { Conflict } from '@application/errors/http/Conflict';
import { RefreshTokenRepository } from '@infra/database/prisma/repositories/RefreshTokenRepository';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class SignOutUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async execute({ userId }: SignOutUseCase.Input): Promise<void> {
    const accountHasActiveSignIns = await this.refreshTokenRepository.findAllByUserId(userId);

    if (!accountHasActiveSignIns) {
      throw new Conflict('No active sessions found for this user.');
    }

    await this.refreshTokenRepository.deleteAllByUserId(userId);
  }
}

export namespace SignOutUseCase {
  export type Input = {
    userId: string;
  };
}
