import { Conflict } from '@application/errors/http/Conflict';
import { Injectable } from '@kermel/decorators/Injectable';
import { App } from '@octokit/app';
import { env } from '@shared/config/env';

export type IGithubAppGateway = {
  getInstallationRepositories(installationId: string): Promise<any[]>;
  getInstallationDetails(installationId: string): Promise<{ githubUserId: string }>;
};

@Injectable()
export class GithubAppGateway implements IGithubAppGateway {
  private app: App;

  constructor() {
    this.app = new App({
      appId: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    });
  }

  async getInstallationRepositories(installationId: string): Promise<any[]> {
    const octokit = await this.app.getInstallationOctokit(Number(installationId));

    const response = await octokit.request('GET /installation/repositories');
    return response.data.repositories;
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
