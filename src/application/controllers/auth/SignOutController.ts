import { SignOutUseCase } from '@application/usecases/auth/SignOutUseCase';
import { Controller } from '@domain/contracts/Controller';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class SignOutController extends Controller<'private', void> {
  constructor(private readonly signOutUseCase: SignOutUseCase) {
    super();
  }

  protected override async handle({
    userId,
  }: Controller.Request<'private'>): Promise<Controller.Response<void>> {
    await this.signOutUseCase.execute({ userId });

    return { statusCode: 204, body: undefined };
  }
}
