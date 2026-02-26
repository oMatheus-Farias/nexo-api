import { uuidv7 } from 'uuidv7';

export class User {
  readonly id: string;

  readonly email: string;

  readonly name: string;

  readonly googleId?: string | null;

  readonly avatarUrl?: string | null;

  readonly createdAt: Date;

  readonly updatedAt: Date;

  constructor(attr: User.Attributes) {
    this.id = uuidv7();
    this.email = attr.email;
    this.name = attr.name;
    this.googleId = attr.googleId ?? null;
    this.avatarUrl = attr.avatarUrl ?? null;
    this.createdAt = attr.createdAt ?? new Date();
    this.updatedAt = attr.updatedAt ?? new Date();
  }

  static create(payload: User.CreatePayload): User {
    return new User({
      email: payload.email,
      name: payload.name,
      googleId: payload.googleId ?? null,
      avatarUrl: payload.avatarUrl ?? null,
    });
  }
}

export namespace User {
  export type Attributes = {
    email: string;
    name: string;
    googleId?: string | null;
    avatarUrl?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type CreatePayload = {
    email: string;
    name: string;
    googleId?: string | null;
    avatarUrl?: string | null;
  };
}
