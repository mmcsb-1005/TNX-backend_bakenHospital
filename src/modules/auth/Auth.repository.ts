import { User, PasswordResetToken } from "./Auth.model";

interface AuthRepository {
  findUserByEmail(email: string): Promise<any>;
  findUserById(id: string): Promise<any>;
  countAdminUsers(): Promise<number>;
  createAdminUser(data: { email: string; name?: string; password: string }): Promise<any>;
  createResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  findValidResetToken(token: string): Promise<any>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
}

class AuthRepositoryImpl implements AuthRepository {
  async findUserByEmail(email: string): Promise<any> {
    return await User.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      },
    });
  }

  async findUserById(id: string): Promise<any> {
    return await User.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async countAdminUsers(): Promise<number> {
    return await User.count({
      where: {
        role: 'ADMIN',
      },
    });
  }

  async createAdminUser(data: { email: string; name?: string; password: string }): Promise<any> {
    return await User.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async createResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await PasswordResetToken.create({
      data: {
        userId,
        token,
        userType: 'user',
        expiresAt,
      },
    });
  }

  async findValidResetToken(token: string): Promise<any> {
    return await PasswordResetToken.findFirst({
      where: {
        token,
        userType: 'user',
        expiresAt: { gt: new Date() },
      },
    });
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await User.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

export const AuthRepository = new AuthRepositoryImpl();


