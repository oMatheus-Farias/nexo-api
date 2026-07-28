import { Controller } from '@domain/contracts/Controller';
import { GetRepositoriesQuery } from '@infra/database/prisma/queries/GetRepositoriesQuery';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class GetRepositoriesController extends Controller<
  'private',
  GetRepositoriesController.Response
> {
  constructor(private readonly getRepositoriesQuery: GetRepositoriesQuery) {
    super();
  }

  protected override async handle({
    userId,
    queryParams,
  }: Controller.Request<'private'>): Promise<
    Controller.Response<GetRepositoriesController.Response>
  > {
    const { page, limitPerPage, searchTerm } = queryParams as GetRepositoriesController.Request;

    const { repositories, meta } = await this.getRepositoriesQuery.execute({
      userId,
      page,
      limitPerPage,
      searchTerm,
    });

    return {
      statusCode: 200,
      body: {
        repositories: repositories.map((repo) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.fullName,
          is_private: repo.isPrivate,
          created_at: repo.createdAt,
        })),
        meta: {
          page_index: meta.pageIndex,
          limit_per_page: meta.limitPerPage,
          count_per_page: meta.countPerPage,
          total_count: meta.totalCount,
        },
      },
    };
  }
}

export namespace GetRepositoriesController {
  export type Request = {
    page: number;
    limitPerPage?: number | undefined;
    searchTerm?: string | undefined;
  };

  export type Response = {
    repositories: Array<{
      id: string;
      name: string;
      full_name: string;
      is_private: boolean;
      created_at: Date;
    }>;
    meta: {
      page_index: number;
      limit_per_page: number;
      count_per_page: number;
      total_count: number;
    };
  };
}
