import { Controller } from '../../../domain/contracts/Controller';
import { Injectable } from '../../../kermel/decorators/Injectable';
import { ListGithubRepositoriesUseCase } from '../../usecases/github/ListGithubRepositoriesUseCase';

@Injectable()
export class ListGithubRepositoriesController extends Controller<'private'> {
  constructor(private readonly useCase: ListGithubRepositoriesUseCase) {
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
