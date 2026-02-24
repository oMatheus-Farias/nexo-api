import { uuidv7 } from 'uuidv7';

export class RefreshToken {
  readonly id: string;

  readonly userId: string;

  readonly createdAt: Date;

  readonly expiresAt: Date;

  constructor(attr: RefreshToken.Attributes) {
    this.id = uuidv7();
    this.userId = attr.userId;
    this.createdAt = attr.createdAt ?? new Date();
    this.expiresAt = attr.expiresAt;
  }

  static create(payload: RefreshToken.CreatePayload): RefreshToken {
    return new RefreshToken({
      userId: payload.userId,
      expiresAt: payload.expiresAt,
    });
  }
}

export namespace RefreshToken {
  export type Attributes = {
    userId: string;
    expiresAt: Date;
    createdAt?: Date;
  };

  export type CreatePayload = {
    userId: string;
    expiresAt: Date;
  };
}
