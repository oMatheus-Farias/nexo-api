import { Injectable } from '@kermel/decorators/Injectable';
import { app } from '@main/app';

@Injectable()
export class JwtTokenGateway {
  private readonly EXPIRES_IN = '7d';

  public sign(accountId: string): string {
    const accessToken = app.jwt.sign({ sub: accountId }, { expiresIn: this.EXPIRES_IN });

    return accessToken;
  }
}
