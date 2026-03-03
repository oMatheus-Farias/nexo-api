import { NotFound } from '@application/errors/http/NotFound';
import { prismaClient } from '@infra/clients/prismaClient';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class GetMeQuery {
  async execute(input: GetMeQuery.Input): Promise<GetMeQuery.Output> {
    const data = await prismaClient.user.findUnique({
      where: {
        id: input.userId,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    if (!data) {
      throw new NotFound('User not found');
    }

    return data;
  }
}

export namespace GetMeQuery {
  export type Input = {
    userId: string;
  };

  export type Output = {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}
