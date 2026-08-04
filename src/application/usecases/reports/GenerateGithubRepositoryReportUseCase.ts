import { BadRequest } from '@application/errors/http/BadRequest';
import { NotFound } from '@application/errors/http/NotFound';
import { PrismaIntegrationRepository } from '@infra/database/prisma/repositories/PrismaIntegrationRepository';
import { PrismaReportRepository } from '@infra/database/prisma/repositories/PrismaReportRepository';
import { PrismaRepositoryRepository } from '@infra/database/prisma/repositories/PrismaRepositoryRepository';
import { GithubAppGateway } from '@infra/gateways/github/GithubAppGateway';
import { OpenAiGateway } from '@infra/gateways/openai/OpenAiGateway';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class GenerateGithubRepositoryReportUseCase {
  constructor(
    private readonly integrationRepository: PrismaIntegrationRepository,
    private readonly repositoryRepository: PrismaRepositoryRepository,
    private readonly reportRepository: PrismaReportRepository,
    private readonly githubAppGateway: GithubAppGateway,
    private readonly openAiGateway: OpenAiGateway,
  ) {}

  async execute(
    input: GenerateGithubRepositoryReportUseCase.Input,
  ): Promise<GenerateGithubRepositoryReportUseCase.Output> {
    const reportStyle = input.reportStyle ?? 'EXECUTIVE';

    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);

    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      throw new BadRequest('Invalid period_start or period_end format.');
    }

    if (periodStart >= periodEnd) {
      throw new BadRequest('period_start must be before period_end.');
    }

    const maxPeriodInDays = 120;
    const periodInMs = periodEnd.getTime() - periodStart.getTime();
    const periodInDays = periodInMs / (1000 * 60 * 60 * 24);

    if (periodInDays > maxPeriodInDays) {
      throw new BadRequest(`Period cannot be greater than ${maxPeriodInDays} days.`);
    }

    const integration = await this.integrationRepository.findByUserIdAndProvider(
      input.userId,
      'GITHUB',
    );

    if (!integration || !integration.installationId) {
      throw new NotFound('GitHub Integration or App Installation not found for this user.');
    }

    const repositoryFilter: {
      repositoryExternalId?: string;
      repositoryFullName?: string;
    } = {};

    if (input.repositoryExternalId) {
      repositoryFilter.repositoryExternalId = input.repositoryExternalId;
    }

    if (input.repositoryFullName) {
      repositoryFilter.repositoryFullName = input.repositoryFullName;
    }

    const repository = await this.githubAppGateway.findInstallationRepository(
      integration.installationId,
      repositoryFilter,
    );

    if (!repository) {
      throw new NotFound('Selected repository was not found in your GitHub App installation.');
    }

    const maxItemsPerType = this.clamp(input.maxItemsPerType ?? 200, 50, 300);

    const activities = await this.githubAppGateway.getRepositoryActivities({
      installationId: integration.installationId,
      owner: repository.owner,
      repo: repository.name,
      periodStart,
      periodEnd,
      maxItemsPerType,
    });

    const contributors = new Map<string, number>();
    activities.commits.forEach((commit) => {
      contributors.set(commit.authorLogin, (contributors.get(commit.authorLogin) ?? 0) + 1);
    });

    const topContributors = [...contributors.entries()]
      .map(([login, commits]) => ({ login, commits }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 10);

    const metrics = {
      totalCommits: activities.commits.length,
      totalPullRequests: activities.pullRequests.length,
      mergedPullRequests: activities.pullRequests.filter((pullRequest) => !!pullRequest.mergedAt)
        .length,
      openPullRequests: activities.pullRequests.filter(
        (pullRequest) => pullRequest.state === 'open',
      ).length,
      totalIssues: activities.issues.length,
      closedIssues: activities.issues.filter((issue) => issue.state === 'closed').length,
      topContributors,
    };

    const compactPayload: OpenAiGateway.GenerateGithubRepositoryReportInput = {
      reportStyle,
      repository: {
        fullName: repository.fullName,
        isPrivate: repository.isPrivate,
      },
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        totalDays: Math.ceil(periodInDays),
      },
      metrics: {
        totalCommits: metrics.totalCommits,
        totalPullRequests: metrics.totalPullRequests,
        mergedPullRequests: metrics.mergedPullRequests,
        openPullRequests: metrics.openPullRequests,
        totalIssues: metrics.totalIssues,
        closedIssues: metrics.closedIssues,
        topContributors: metrics.topContributors.slice(0, 5),
      },
      activityDigest: {
        recentCommits: activities.commits.slice(0, 15).map((commit) => ({
          authorLogin: commit.authorLogin,
          message: this.truncateText(commit.message, 140),
          committedAt: commit.committedAt,
        })),
        recentPullRequests: activities.pullRequests.slice(0, 12).map((pullRequest) => ({
          number: pullRequest.number,
          title: this.truncateText(pullRequest.title, 140),
          state: pullRequest.state,
          merged: !!pullRequest.mergedAt,
          updatedAt: pullRequest.updatedAt,
        })),
        recentIssues: activities.issues.slice(0, 12).map((issue) => ({
          number: issue.number,
          title: this.truncateText(issue.title, 140),
          state: issue.state,
          comments: issue.comments,
          updatedAt: issue.updatedAt,
        })),
      },
    };

    const reportFromAi = await this.openAiGateway.generateGithubRepositoryReport(compactPayload);

    const localRepository = await this.repositoryRepository.upsertByIntegrationAndExternalId({
      integrationId: integration.id,
      externalRepoId: repository.id,
      name: repository.name,
      fullName: repository.fullName,
      isPrivate: repository.isPrivate,
      syncStatus: 'SYNCED',
      isEnabled: true,
      lastSyncedAt: new Date(),
      lastSyncAttemptAt: new Date(),
      lastSyncError: null,
      disconnectedAt: null,
    });

    const createdReport = await this.reportRepository.createWithUsage({
      userId: input.userId,
      repositoryId: localRepository.id,
      periodStart,
      periodEnd,
      summaryText: reportFromAi.summaryText,
      usage: {
        model: reportFromAi.model,
        totalTokens: reportFromAi.usage.totalTokens,
      },
    });

    return {
      reportId: createdReport.id,
      createdAt: createdReport.createdAt,
      repository: {
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        isPrivate: repository.isPrivate,
        htmlUrl: repository.htmlUrl,
      },
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      reportStyle,
      summaryText: reportFromAi.summaryText,
      metrics,
      usage: {
        model: reportFromAi.model,
        totalTokens: reportFromAi.usage.totalTokens,
      },
    };
  }

  private clamp(value: number, min: number, max: number): number {
    if (value < min) {
      return min;
    }

    if (value > max) {
      return max;
    }

    return value;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength - 3).trim()}...`;
  }
}

export namespace GenerateGithubRepositoryReportUseCase {
  export type Input = {
    userId: string;
    reportStyle?: 'EXECUTIVE' | 'TECHNICAL' | 'SPRINT' | 'WEEKLY';
    repositoryExternalId?: string;
    repositoryFullName?: string;
    periodStart: string;
    periodEnd: string;
    maxItemsPerType?: number;
  };

  export type Output = {
    reportId: string;
    createdAt: Date;
    repository: {
      id: string;
      name: string;
      fullName: string;
      isPrivate: boolean;
      htmlUrl: string;
    };
    period: {
      start: string;
      end: string;
    };
    reportStyle: 'EXECUTIVE' | 'TECHNICAL' | 'SPRINT' | 'WEEKLY';
    summaryText: string;
    metrics: {
      totalCommits: number;
      totalPullRequests: number;
      mergedPullRequests: number;
      openPullRequests: number;
      totalIssues: number;
      closedIssues: number;
      topContributors: Array<{
        login: string;
        commits: number;
      }>;
    };
    usage: {
      model: string;
      totalTokens: number;
    };
  };
}
