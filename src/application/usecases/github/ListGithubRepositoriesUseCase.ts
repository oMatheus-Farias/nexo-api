import { SyncGithubRepositoriesUseCase } from '@application/usecases/github/SyncGithubRepositoriesUseCase';

import { Injectable } from '../../../kermel/decorators/Injectable';

@Injectable()
export class ListGithubRepositoriesUseCase {
  constructor(private readonly syncGithubRepositoriesUseCase: SyncGithubRepositoriesUseCase) {}

  async execute(userId: string): Promise<GithubAppRepository[]> {
    return this.syncGithubRepositoriesUseCase.execute(userId);
  }
}

export type GithubAppRepository = {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  htmlUrl: string;
};
