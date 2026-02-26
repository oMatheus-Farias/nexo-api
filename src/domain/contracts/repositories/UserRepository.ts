import type { User } from '@infra/prisma/generated/prisma/client';

export type CreateGoogleUserInput = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type CreateGithubUserInput = {
  githubId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type UpdateGoogleIdAndAvatarInput = {
  userId: string;
  googleId: string;
  avatarUrl?: string;
  name?: string;
};

export type UpdateGithubIdAndAvatarInput = {
  userId: string;
  githubId: string;
  avatarUrl?: string;
  name?: string;
};

export abstract class IUserRepository {
  abstract findById(userId: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByGoogleId(googleId: string): Promise<User | null>;
  abstract findByGithubId(githubId: string): Promise<User | null>;
  abstract create(data: User): Promise<Pick<User, 'id'>>;
  abstract createGoogleUser(googleData: CreateGoogleUserInput): Promise<Pick<User, 'id' | 'email'>>;
  abstract createGithubUser(githubData: CreateGithubUserInput): Promise<Pick<User, 'id' | 'email'>>;
  abstract update(userId: string, data: Partial<User>): Promise<Pick<User, 'id'>>;
  abstract updateGoogleId(userId: string, googleId: string): Promise<Pick<User, 'id'>>;
  abstract updateGithubId(userId: string, githubId: string): Promise<Pick<User, 'id'>>;
  abstract updateGoogleIdAndAvatar(input: UpdateGoogleIdAndAvatarInput): Promise<Pick<User, 'id'>>;
  abstract updateGithubIdAndAvatar(input: UpdateGithubIdAndAvatarInput): Promise<Pick<User, 'id'>>;
  abstract delete(userId: string): Promise<void>;
}
