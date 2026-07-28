import { prismaClient } from '@infra/clients/prismaClient';
import type { RepositoryWhereInput } from '@infra/prisma/generated/prisma/models';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class GetRepositoriesQuery {
  async execute(input: GetRepositoriesQuery.Input): Promise<GetRepositoriesQuery.Output> {
    const where: RepositoryWhereInput = {
      integration: {
        userId: input.userId,
      },
    };

    const hasSearchTerm = input.searchTerm?.trim() && input.searchTerm !== 'undefined';
    if (hasSearchTerm) {
      where.OR = [
        { name: { contains: input.searchTerm!, mode: 'insensitive' } },
        { fullName: { contains: input.searchTerm!, mode: 'insensitive' } },
      ];
    }

    const totalCount = await prismaClient.repository.count({ where });

    const repositories = await prismaClient.repository.findMany({
      skip: (input.page - 1 || 0) * (input.limitPerPage ?? 10),
      take: input.limitPerPage ?? 10,
      where,
      select: {
        id: true,
        name: true,
        fullName: true,
        isPrivate: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      repositories,
      meta: {
        pageIndex: input.page - 1 || 0,
        limitPerPage: input.limitPerPage ?? 10,
        countPerPage: repositories.length,
        totalCount,
      },
    };
  }
}

export namespace GetRepositoriesQuery {
  export type Input = {
    userId: string;
    page: number;
    limitPerPage?: number | undefined;
    searchTerm?: string | undefined;
  };

  export type Output = {
    repositories: Array<{
      id: string;
      name: string;
      fullName: string;
      isPrivate: boolean;
      createdAt: Date;
    }>;
    meta: {
      pageIndex: number;
      limitPerPage: number;
      countPerPage: number;
      totalCount: number;
    };
  };
}
