import { Controller } from '@domain/contracts/Controller';
import { GetRepositoriesQuery } from '@infra/database/prisma/queries/GetRepositoriesQuery';
import { Injectable } from '@kermel/decorators/Injectable';
import { z } from 'zod';

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

    const parsedQueryParams = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limitPerPage: z.coerce.number().int().min(1).max(100).optional(),
        searchTerm: z.string().optional(),
      })
      .parse({ page, limitPerPage, searchTerm });

    const { repositories, meta } = await this.getRepositoriesQuery.execute({
      userId,
      page: parsedQueryParams.page,
      limitPerPage: parsedQueryParams.limitPerPage,
      searchTerm: parsedQueryParams.searchTerm,
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
          sync_status: repo.syncStatus,
          is_enabled: repo.isEnabled,
          last_synced_at: repo.lastSyncedAt,
          last_sync_attempt_at: repo.lastSyncAttemptAt,
          last_sync_error: repo.lastSyncError,
          disconnected_at: repo.disconnectedAt,
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
      sync_status: 'SYNCED' | 'PENDING' | 'DISCONNECTED' | 'PAUSED' | 'ERROR';
      is_enabled: boolean;
      last_synced_at: Date | null;
      last_sync_attempt_at: Date | null;
      last_sync_error: string | null;
      disconnected_at: Date | null;
    }>;
    meta: {
      page_index: number;
      limit_per_page: number;
      count_per_page: number;
      total_count: number;
    };
  };
}
