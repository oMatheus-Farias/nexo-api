import { Controller } from '@domain/contracts/Controller';
import { GetMeQuery } from '@infra/database/prisma/queries/GetMeQuery';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class GetMeController extends Controller<'private', GetMeController.Response> {
  constructor(private readonly getMeQuery: GetMeQuery) {
    super();
  }

  protected override async handle({
    userId,
  }: Controller.Request<'private'>): Promise<Controller.Response<GetMeController.Response>> {
    const { id, name, avatarUrl } = await this.getMeQuery.execute({ userId });

    return {
      statusCode: 200,
      body: {
        id,
        name,
        avatar_url: avatarUrl,
      },
    };
  }
}

export namespace GetMeController {
  export type Response = {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}
