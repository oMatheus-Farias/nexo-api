import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';

import { SyncGithubRepositoriesUseCase } from '../../usecases/github/SyncGithubRepositoriesUseCase';

@Injectable()
export class SyncRepositoryController extends Controller<
  'private',
  SyncRepositoryController.Response
> {
  constructor(private readonly useCase: SyncGithubRepositoriesUseCase) {
    super();
  }

  protected override async handle(
    request: Controller.Request<'private'>,
  ): Promise<Controller.Response<SyncRepositoryController.Response>> {
    const { userId, params } = request as Controller.Request<'private'> & {
      params: { id: string };
    };

    const repositories = await this.useCase.execute(userId, {
      repositoryId: params.id,
    });

    return {
      statusCode: 200,
      body: {
        repositories,
      },
    };
  }
}

export namespace SyncRepositoryController {
  export type Response = {
    repositories: Array<{
      id: string;
      name: string;
      fullName: string;
      owner: string;
      isPrivate: boolean;
      htmlUrl: string;
    }>;
  };
}
