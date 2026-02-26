import { Injectable } from '@kermel/decorators/Injectable';
import { app } from '@main/app';

@Injectable()
export class JwtTokenGateway {
  private readonly EXPIRES_IN = '7d';

  public sign(userId: string): string {
    const accessToken = app.jwt.sign({ sub: userId }, { expiresIn: this.EXPIRES_IN });

    return accessToken;
  }
}
