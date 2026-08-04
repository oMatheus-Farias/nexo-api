import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';

import { DiscoverGithubRepositoriesUseCase } from '../../usecases/github/DiscoverGithubRepositoriesUseCase';

@Injectable()
export class DiscoverRepositoriesController extends Controller<
  'private',
  DiscoverRepositoriesController.Response
> {
  constructor(private readonly useCase: DiscoverGithubRepositoriesUseCase) {
    super();
  }

  protected override async handle({
    userId,
  }: Controller.Request<'private'>): Promise<
    Controller.Response<DiscoverRepositoriesController.Response>
  > {
    const repositories = await this.useCase.execute(userId);

    return {
      statusCode: 200,
      body: {
        repositories,
      },
    };
  }
}

export namespace DiscoverRepositoriesController {
  export type Response = {
    repositories: DiscoverGithubRepositoriesUseCase.Output;
  };
}
