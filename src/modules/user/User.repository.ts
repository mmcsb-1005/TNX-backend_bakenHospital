import { Model } from "./User.model";
import type { Prisma } from "@prisma/client";
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
    return await Model.findMany({
      where: {
        role: 'USER' // Only return users with USER role
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        position: true,
        designationId: true,
        designation: true,
        contactNumber: true,
        employmentDate: true,
        role: true,
        userOrgId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  async getUserById(id: string): Promise<any> {
    return await Model.findUnique({ 
      where: { id },
      include: {
        designation: true
      }
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<any> {
    // Hash the password if provided in the input data
    const payload = { ...data } as Prisma.UserCreateInput;
    if ((payload as any).password) {
        (payload as any).password = await hashPasswordIfNeeded((payload as any).password as string);
    }
    // Create the new User record
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
        position: true,
        contactNumber: true,
        employmentDate: true,
        userOrgId: true,
      },
      orderBy: { name: 'asc' }, // Order the output
    });
  }
}

export const UserRepository = new UserRepositoryImpl();
