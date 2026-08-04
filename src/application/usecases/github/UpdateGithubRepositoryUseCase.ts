import { NotFound } from '@application/errors/http/NotFound';
import { PrismaRepositoryRepository } from '@infra/database/prisma/repositories/PrismaRepositoryRepository';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class UpdateGithubRepositoryUseCase {
  constructor(private readonly repositoryRepository: PrismaRepositoryRepository) {}

  async execute(
    input: UpdateGithubRepositoryUseCase.Input,
  ): Promise<UpdateGithubRepositoryUseCase.Output> {
    const repository = await this.repositoryRepository.findByIdAndUserId(
      input.repositoryId,
      input.userId,
    );

    if (!repository) {
      throw new NotFound('Repository not found.');
    }

    if (!input.isEnabled) {
      return this.repositoryRepository.updateById(repository.id, {
        isEnabled: false,
        syncStatus: 'PAUSED',
      });
    }

    return this.repositoryRepository.updateById(repository.id, {
      isEnabled: true,
      syncStatus: 'PENDING',
      lastSyncAttemptAt: new Date(),
      lastSyncError: null,
      disconnectedAt: null,
    });
  }
}

export namespace UpdateGithubRepositoryUseCase {
  export type Input = {
    userId: string;
    repositoryId: string;
    isEnabled: boolean;
  };

  export type Output = Awaited<ReturnType<PrismaRepositoryRepository['updateById']>>;
}
