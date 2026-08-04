import { Conflict } from '@application/errors/http/Conflict';
import { Injectable } from '@kermel/decorators/Injectable';
import { App } from '@octokit/app';
import { env } from '@shared/config/env';

export abstract class IGithubAppGateway {
  abstract getInstallationRepositories(
    installationId: string,
  ): Promise<GithubAppGateway.InstallationRepository[]>;

  abstract findInstallationRepository(
    installationId: string,
    filter: {
      repositoryExternalId?: string;
      repositoryFullName?: string;
    },
  ): Promise<GithubAppGateway.SelectedRepository | null>;

  abstract getRepositoryActivities(input: {
    installationId: string;
    owner: string;
    repo: string;
    periodStart: Date;
    periodEnd: Date;
    maxItemsPerType?: number;
  }): Promise<GithubAppGateway.RepositoryActivities>;

  abstract getInstallationDetails(installationId: string): Promise<{ githubUserId: string }>;
}

@Injectable()
export class GithubAppGateway implements IGithubAppGateway {
  private app: App;

  constructor() {
    this.app = new App({
      appId: env.GITHUB_APP_ID,
      privateKey: Buffer.from(env.GITHUB_APP_PRIVATE_KEY, 'base64').toString('ascii'),
    });
  }

  async getInstallationRepositories(
    installationId: string,
  ): Promise<GithubAppGateway.InstallationRepository[]> {
    const octokit = await this.app.getInstallationOctokit(Number(installationId));
    const repositories: GithubAppGateway.InstallationRepository[] = [];

    let page = 1;

    while (true) {
      const response = await octokit.request('GET /installation/repositories', {
        per_page: 100,
        page,
      });

      repositories.push(
        ...(response.data.repositories as GithubAppGateway.InstallationRepository[]),
      );

      if (response.data.repositories.length < 100) {
        break;
      }

      page += 1;
    }

    return repositories;
  }

  async findInstallationRepository(
    installationId: string,
    filter: {
      repositoryExternalId?: string;
      repositoryFullName?: string;
    },
  ): Promise<GithubAppGateway.SelectedRepository | null> {
    const repositories = await this.getInstallationRepositories(installationId);

    const repository = repositories.find((item) => {
      if (filter.repositoryExternalId) {
        return item.id?.toString() === filter.repositoryExternalId;
      }

      if (filter.repositoryFullName) {
        return item.full_name?.toLowerCase() === filter.repositoryFullName.toLowerCase();
      }

      return false;
    });

    if (!repository) {
      return null;
    }

    return {
      id: repository.id.toString(),
      name: repository.name,
      fullName: repository.full_name,
      owner: repository.owner.login,
      isPrivate: repository.private,
      htmlUrl: repository.html_url,
    };
  }

  async getRepositoryActivities(input: {
    installationId: string;
    owner: string;
    repo: string;
    periodStart: Date;
    periodEnd: Date;
    maxItemsPerType?: number;
  }): Promise<GithubAppGateway.RepositoryActivities> {
    const octokit = await this.app.getInstallationOctokit(Number(input.installationId));
    const maxItemsPerType = input.maxItemsPerType ?? 200;

    const commits: GithubAppGateway.CommitActivity[] = [];
    const pullRequests: GithubAppGateway.PullRequestActivity[] = [];
    const issues: GithubAppGateway.IssueActivity[] = [];

    let commitsPage = 1;
    while (commits.length < maxItemsPerType) {
      const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
        owner: input.owner,
        repo: input.repo,
        since: input.periodStart.toISOString(),
        until: input.periodEnd.toISOString(),
        per_page: 100,
        page: commitsPage,
      });

      if (!response.data.length) {
        break;
      }

      commits.push(
        ...response.data
          .map((commit) => {
            const committedAt = commit.commit.committer?.date ?? commit.commit.author?.date;

            if (!committedAt) {
              return null;
            }

            return {
              sha: commit.sha,
              message: commit.commit.message.split('\n')[0] ?? commit.commit.message,
              authorLogin:
                commit.author?.login ??
                commit.commit.author?.name ??
                commit.committer?.login ??
                'unknown',
              committedAt,
              htmlUrl: commit.html_url,
            };
          })
          .filter((item): item is GithubAppGateway.CommitActivity => item !== null),
      );

      if (response.data.length < 100) {
        break;
      }

      commitsPage += 1;
    }

    let pullsPage = 1;
    while (pullRequests.length < maxItemsPerType) {
      const response = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
        owner: input.owner,
        repo: input.repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
        page: pullsPage,
      });

      if (!response.data.length) {
        break;
      }

      const mapped = response.data
        .map((pullRequest) => {
          const occurredAt =
            pullRequest.merged_at ??
            pullRequest.closed_at ??
            pullRequest.updated_at ??
            pullRequest.created_at;

          if (!occurredAt) {
            return null;
          }

          const occurredAtDate = new Date(occurredAt);
          if (occurredAtDate < input.periodStart || occurredAtDate > input.periodEnd) {
            return null;
          }

          return {
            number: pullRequest.number,
            title: pullRequest.title,
            state: pullRequest.state,
            authorLogin: pullRequest.user?.login ?? 'unknown',
            createdAt: pullRequest.created_at,
            updatedAt: pullRequest.updated_at,
            mergedAt: pullRequest.merged_at,
            closedAt: pullRequest.closed_at,
            htmlUrl: pullRequest.html_url,
          };
        })
        .filter((item): item is GithubAppGateway.PullRequestActivity => item !== null);

      pullRequests.push(...mapped);

      const oldestUpdatedAt = response.data[response.data.length - 1]?.updated_at;
      if (oldestUpdatedAt && new Date(oldestUpdatedAt) < input.periodStart) {
        break;
      }

      if (response.data.length < 100) {
        break;
      }

      pullsPage += 1;
    }

    let issuesPage = 1;
    try {
      while (issues.length < maxItemsPerType) {
        const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
          owner: input.owner,
          repo: input.repo,
          state: 'all',
          sort: 'updated',
          direction: 'desc',
          since: input.periodStart.toISOString(),
          per_page: 100,
          page: issuesPage,
        });

        if (!response.data.length) {
          break;
        }

        issues.push(
          ...response.data
            .filter((item) => !item.pull_request)
            .map(
              (issue): GithubAppGateway.IssueActivity => ({
                number: issue.number,
                title: issue.title,
                state: issue.state === 'closed' ? 'closed' : 'open',
                authorLogin: issue.user?.login ?? 'unknown',
                createdAt: issue.created_at,
                updatedAt: issue.updated_at,
                closedAt: issue.closed_at,
                comments: issue.comments,
                htmlUrl: issue.html_url,
              }),
            )
            .filter((issue) => {
              const updatedAtDate = new Date(issue.updatedAt);
              return updatedAtDate <= input.periodEnd;
            }),
        );

        const oldestUpdatedAt = response.data[response.data.length - 1]?.updated_at;
        if (oldestUpdatedAt && new Date(oldestUpdatedAt) < input.periodStart) {
          break;
        }

        if (response.data.length < 100) {
          break;
        }

        issuesPage += 1;
      }
    } catch (error) {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status?: unknown }).status)
          : undefined;

      if (status === 403) {
        // eslint-disable-next-line no-console
        console.warn(
          `GitHub App does not have access to issues for ${input.owner}/${input.repo}. Continuing report without issue data.`,
        );
      } else {
        throw error;
      }
    }

    return {
      commits: commits.slice(0, maxItemsPerType),
      pullRequests: pullRequests.slice(0, maxItemsPerType),
      issues: issues.slice(0, maxItemsPerType),
    };
  }

  async getInstallationDetails(installationId: string): Promise<{ githubUserId: string }> {
    const octokit = this.app.octokit;
    const response = await octokit.request('GET /app/installations/{installation_id}', {
      installation_id: Number(installationId),
    });

    const account = response.data.account;

    if (!account || !account.id) {
      throw new Conflict('Could not resolve account for this installation.');
    }

    return {
      githubUserId: account.id.toString(),
    };
  }
}

export namespace GithubAppGateway {
  export type InstallationRepository = {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
      login: string;
    };
    html_url: string;
  };

  export type SelectedRepository = {
    id: string;
    name: string;
    fullName: string;
    owner: string;
    isPrivate: boolean;
    htmlUrl: string;
  };

  export type CommitActivity = {
    sha: string;
    message: string;
    authorLogin: string;
    committedAt: string;
    htmlUrl: string;
  };

  export type PullRequestActivity = {
    number: number;
    title: string;
    state: 'open' | 'closed';
    authorLogin: string;
    createdAt: string;
    updatedAt: string;
    mergedAt: string | null;
    closedAt: string | null;
    htmlUrl: string;
  };

  export type IssueActivity = {
    number: number;
    title: string;
    state: 'open' | 'closed';
    authorLogin: string;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
    comments: number;
    htmlUrl: string;
  };

  export type RepositoryActivities = {
    commits: CommitActivity[];
    pullRequests: PullRequestActivity[];
    issues: IssueActivity[];
  };
}
