import { SyncGithubRepositoriesUseCase } from '@application/usecases/github/SyncGithubRepositoriesUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class SyncRepositoriesController extends Controller<'private'> {
  constructor(private readonly useCase: SyncGithubRepositoriesUseCase) {
    super();
  }

  async handle({ userId }: Controller.Request<'private'>): Promise<Controller.Response<any>> {
    const repositories = await this.useCase.execute(userId);

    return {
      statusCode: 200,
      body: { repositories },
    };
  }
}
