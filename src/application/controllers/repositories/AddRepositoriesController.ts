import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';
import { Schema } from '@kermel/decorators/Schema';
import { z } from 'zod';

import { AddGithubRepositoriesUseCase } from '../../usecases/github/AddGithubRepositoriesUseCase';

const addRepositoriesSchema = z.object({
  external_repo_ids: z.array(z.string().min(1)).min(1),
});

type AddRepositoriesBody = z.infer<typeof addRepositoriesSchema>;

@Injectable()
@Schema(addRepositoriesSchema)
export class AddRepositoriesController extends Controller<
  'private',
  AddRepositoriesController.Response
> {
  constructor(private readonly useCase: AddGithubRepositoriesUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
  }: Controller.Request<'private', AddRepositoriesBody>): Promise<
    Controller.Response<AddRepositoriesController.Response>
  > {
    const repositories = await this.useCase.execute({
      userId,
      externalRepoIds: body.external_repo_ids,
    });

    return {
      statusCode: 201,
      body: {
        repositories,
      },
    };
  }
}

export namespace AddRepositoriesController {
  export type Response = {
    repositories: AddGithubRepositoriesUseCase.Output;
  };
}
