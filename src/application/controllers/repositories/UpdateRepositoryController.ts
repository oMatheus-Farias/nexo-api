import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';
import { Schema } from '@kermel/decorators/Schema';
import { z } from 'zod';

import { UpdateGithubRepositoryUseCase } from '../../usecases/github/UpdateGithubRepositoryUseCase';

const updateRepositorySchema = z.object({
  is_enabled: z.boolean(),
});

type UpdateRepositoryBody = z.infer<typeof updateRepositorySchema>;

@Injectable()
@Schema(updateRepositorySchema)
export class UpdateRepositoryController extends Controller<
  'private',
  UpdateRepositoryController.Response
> {
  constructor(private readonly useCase: UpdateGithubRepositoryUseCase) {
    super();
  }

  protected override async handle({
    userId,
    body,
    params,
  }: Controller.Request<'private', UpdateRepositoryBody, { id: string }>): Promise<
    Controller.Response<UpdateRepositoryController.Response>
  > {
    const repository = await this.useCase.execute({
      userId,
      repositoryId: params.id,
      isEnabled: body.is_enabled,
    });

    return {
      statusCode: 200,
      body: {
        repository,
      },
    };
  }
}

export namespace UpdateRepositoryController {
  export type Response = {
    repository: Awaited<ReturnType<UpdateGithubRepositoryUseCase['execute']>>;
  };
}
