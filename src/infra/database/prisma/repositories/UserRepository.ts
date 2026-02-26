import type {
  CreateGoogleUserInput,
  IUserRepository,
  UpdateGoogleIdAndAvatarInput,
} from '@domain/contracts/repositories/UserRepository';
import { prismaClient } from '@infra/clients/prismaClient';
import type { User } from '@infra/prisma/generated/prisma/client';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class UserRepository implements IUserRepository {
  async findById(userId: string): Promise<User | null> {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return user;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await prismaClient.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      return null;
    }

    return user;
  }

  async create(data: User): Promise<Pick<User, 'id'>> {
    const createdUserId = await prismaClient.user.create({
      data,
      select: { id: true },
    });

    return createdUserId;
  }

  async createGoogleUser(googleData: CreateGoogleUserInput): Promise<Pick<User, 'id' | 'email'>> {
    const createdUserId = await prismaClient.user.create({
      data: googleData,
      select: { id: true, email: true },
    });

    return createdUserId;
  }

  async update(userId: string, data: Partial<User>): Promise<Pick<User, 'id'>> {
    const updatedUserId = await prismaClient.user.update({
      where: { id: userId },
      data,
      select: { id: true },
    });

    return updatedUserId;
  }

  async updateGoogleId(userId: string, googleId: string): Promise<Pick<User, 'id'>> {
    const updatedUserId = await prismaClient.user.update({
      where: { id: userId },
      data: { googleId },
      select: { id: true },
    });

    return updatedUserId;
  }

  async updateGoogleIdAndAvatar(input: UpdateGoogleIdAndAvatarInput): Promise<Pick<User, 'id'>> {
    const dataToUpdate: Partial<User> = {
      googleId: input.googleId,
      avatarUrl: input.avatarUrl ?? null,
    };

    if (input.name) {
      dataToUpdate.name = input.name;
    }

    const updatedUser = await prismaClient.user.update({
      where: { id: input.userId },
      data: dataToUpdate,
      select: { id: true },
    });

    return updatedUser;
  }

  async delete(userId: string): Promise<void> {
    await prismaClient.user.delete({
      where: { id: userId },
    });
  }
}
