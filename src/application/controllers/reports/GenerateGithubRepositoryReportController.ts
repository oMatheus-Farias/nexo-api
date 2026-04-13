import { GenerateGithubRepositoryReportUseCase } from '@application/usecases/reports/GenerateGithubRepositoryReportUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';
import { Schema } from '@kermel/decorators/Schema';

import {
  type GenerateGithubRepositoryReportBody,
  generateGithubRepositoryReportSchema,
} from './schemas/generateGithubRepositoryReportSchema';

@Injectable()
@Schema(generateGithubRepositoryReportSchema)
export class GenerateGithubRepositoryReportController extends Controller<
  'private',
  GenerateGithubRepositoryReportController.Response
> {
  constructor(private readonly useCase: GenerateGithubRepositoryReportUseCase) {
    super();
  }

  protected override async handle({
    body,
    userId,
  }: Controller.Request<'private', GenerateGithubRepositoryReportBody>): Promise<
    Controller.Response<GenerateGithubRepositoryReportController.Response>
  > {
    const input: GenerateGithubRepositoryReportUseCase.Input = {
      userId,
      reportStyle: body.report_style,
      periodStart: body.period_start,
      periodEnd: body.period_end,
    };

    if (body.repository_external_id) {
      input.repositoryExternalId = body.repository_external_id;
    }

    if (body.repository_full_name) {
      input.repositoryFullName = body.repository_full_name;
    }

    if (body.max_items_per_type !== undefined) {
      input.maxItemsPerType = body.max_items_per_type;
    }

    const output = await this.useCase.execute(input);

    return {
      statusCode: 201,
      body: {
        report_id: output.reportId,
        created_at: output.createdAt,
        repository: {
          id: output.repository.id,
          name: output.repository.name,
          full_name: output.repository.fullName,
          is_private: output.repository.isPrivate,
          html_url: output.repository.htmlUrl,
        },
        period: {
          start: output.period.start,
          end: output.period.end,
        },
        report_style: output.reportStyle,
        summary_text: output.summaryText,
        metrics: {
          total_commits: output.metrics.totalCommits,
          total_pull_requests: output.metrics.totalPullRequests,
          merged_pull_requests: output.metrics.mergedPullRequests,
          open_pull_requests: output.metrics.openPullRequests,
          total_issues: output.metrics.totalIssues,
          closed_issues: output.metrics.closedIssues,
          top_contributors: output.metrics.topContributors,
        },
        usage: {
          model: output.usage.model,
          total_tokens: output.usage.totalTokens,
        },
      },
    };
  }
}

export namespace GenerateGithubRepositoryReportController {
  export type Response = {
    report_id: string;
    created_at: Date;
    repository: {
      id: string;
      name: string;
      full_name: string;
      is_private: boolean;
      html_url: string;
    };
    period: {
      start: string;
      end: string;
    };
    report_style: 'EXECUTIVE' | 'TECHNICAL' | 'SPRINT' | 'WEEKLY';
    summary_text: string;
    metrics: {
      total_commits: number;
      total_pull_requests: number;
      merged_pull_requests: number;
      open_pull_requests: number;
      total_issues: number;
      closed_issues: number;
      top_contributors: Array<{
        login: string;
        commits: number;
      }>;
    };
    usage: {
      model: string;
      total_tokens: number;
    };
  };
}
