import { Model } from "./User.model";
import type { Prisma } from "../../../generated/prisma/client";
import { hashPasswordIfNeeded } from "../../utils/password";
import { prisma } from "../../lib/prisma";

interface UserRepository {
  getAllUser(): Promise<any[]>;
  getUserById(id: String): Promise<any>;
  createUser(data: any): Promise<any>;
  updateUser(id: String, data: any): Promise<any>;
  deleteUser(id: String): Promise<void>;
  bulkDeleteUsers(ids: string[]): Promise<{ deletedCount: number }>;
}

class UserRepositoryImpl implements UserRepository {
  async getAllUser(): Promise<any[]> {
    return await Model.findMany();
  }

  async getUserById(id: string): Promise<any> {
    return await Model.findUnique({ where: { id } });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<any> {
    // 1. Fetch the Vendor/License configuration
    const license = await prisma.systemLicense.findFirst();

    // Default to a safe limit (e.g., 5) if no license record exists yet
    const limit = license?.maxUserCount ?? 5; 

    // 2. Check current count
    const currentCount = await prisma.user.count();

    // 3. Enforce the limit
    if (currentCount >= limit) {
        throw new Error(`Subscription limit reached. Your license allows ${limit} users. Please contact support to upgrade.`);
    }
    // 4. Preserve current hashing logic
    const payload = { ...data } as Prisma.UserCreateInput;
    if ((payload as any).password) {
        // Hash the password if provided in the input data
        (payload as any).password = await hashPasswordIfNeeded((payload as any).password as string);
    }
    // 5. Create the new User record
    return await prisma.user.create({ data: payload });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<any> {
    const payload: Prisma.UserUpdateInput = { ...data };
    if (payload.password && typeof payload.password === 'string') {
      payload.password = await hashPasswordIfNeeded(payload.password);
    }
    return await Model.update({ where: { id }, data: payload });
  }

  async deleteUser(id: string): Promise<void> {
    await Model.delete({ where: { id } });
  }

  async bulkDeleteUsers(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await prisma.user.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });
    return { deletedCount: result.count };
  }

  async getAllUserForExport(): Promise<any[]> {
    return prisma.user.findMany({
      select: {
        name: true,
        email: true,
        userOrgId: true,
      },
      orderBy: { name: 'asc' }, // Order the output
    });
  }
}

export const UserRepository = new UserRepositoryImpl();
