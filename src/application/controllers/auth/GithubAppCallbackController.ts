import { Controller } from '../../../domain/contracts/Controller';
import { Injectable } from '../../../kermel/decorators/Injectable';
import { GithubAppInstallCallbackUseCase } from '../../usecases/auth/GithubAppInstallCallbackUseCase';

@Injectable()
export class GithubAppCallbackController extends Controller<'public'> {
  constructor(private readonly useCase: GithubAppInstallCallbackUseCase) {
    super();
  }

  async handle(request: Controller.Request<'public'>): Promise<Controller.Response<any>> {
    const { installation_id, setup_action } = request.queryParams as {
      installation_id?: string;
      setup_action?: string;
    };

    try {
      await this.useCase.execute({
        installationId: installation_id as string,
        setupAction: setup_action as string,
      });

      return {
        statusCode: 302,
        headers: {
          Location: `${process.env.FRONTEND_URL}/dashboard/repositories?source=github_app_success`,
        },
      };
    } catch (error: any) {
      if (error.message === 'USER_NOT_LINKED_TO_GITHUB') {
        return {
          statusCode: 302,
          headers: {
            Location: `${process.env.FRONTEND_URL}/dashboard/repositories?error=github_not_linked`,
          },
        };
      }

      return {
        statusCode: 302,
        headers: {
          Location: `${process.env.FRONTEND_URL}/dashboard/repositories?error=app_install_failed`,
        },
      };
    }
  }
}
