import prisma from '../lib/prisma';

export class UserRoleService {
  
  /**
   * Assign single role to user
   */
  static async assignRole(userId: string, roleName: string) {
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id
        }
      }
    });

    if (existingUserRole) {
      throw new Error(`User already has role '${roleName}'`);
    }

    return await prisma.userRole.create({
      data: {
        userId,
        roleId: role.id
      },
      include: {
        role: true,
        user: true
      }
    });
  }

  /**
   * Assign multiple roles to user
   */
  static async assignMultipleRoles(userId: string, roleNames: string[]) {
    const roles = await prisma.role.findMany({
      where: {
        name: { in: roleNames }
      }
    });

    if (roles.length !== roleNames.length) {
      const foundRoleNames = roles.map(r => r.name);
      const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
      throw new Error(`Roles not found: ${missingRoles.join(', ')}`);
    }

    // Get existing user roles to avoid duplicates
    const existingUserRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true }
    });

    const existingRoleNames = existingUserRoles.map(ur => ur.role.name);

    const newRoles = roles.filter(role => !existingRoleNames.includes(role.name));

    if (newRoles.length === 0) {
      return { message: 'User already has all specified roles', existingRoles: existingRoleNames };
    }

    const userRoleData = newRoles.map(role => ({
      userId,
      roleId: role.id
    }));

    await prisma.userRole.createMany({
      data: userRoleData
    });

    return {
      message: `Successfully assigned ${newRoles.length} new roles`,
      assignedRoles: newRoles.map(r => r.name),
      existingRoles: existingRoleNames
    };
  }

  /**
   * Remove role from user
   */
  static async removeRole(userId: string, roleName: string) {
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id
        }
      }
    });

    if (!userRole) {
      throw new Error(`User does not have role '${roleName}'`);
    }

    return await prisma.userRole.delete({
      where: { id: userRole.id }
    });
  }

  /**
   * Get user with all roles
   */
  static async getUserWithRoles(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(userId: string, roleName: string): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          name: roleName
        }
      }
    });

    return !!userRole;
  }

  /**
   * Check if user has any of the specified roles
   */
  static async hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          name: { in: roleNames }
        }
      }
    });

    return !!userRole;
  }

  /**
   * Check if user has all specified roles
   */
  static async hasAllRoles(userId: string, roleNames: string[]): Promise<boolean> {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        role: {
          name: { in: roleNames }
        }
      },
      include: { role: true }
    });

    const userRoleNames = userRoles.map(ur => ur.role.name);
    return roleNames.every(roleName => userRoleNames.includes(roleName));
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(roleName: string) {
    return await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: roleName
            }
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  /**
   * Replace user roles (remove all existing and assign new ones)
   */
  static async replaceUserRoles(userId: string, roleNames: string[]) {
    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // Remove all existing roles
      await tx.userRole.deleteMany({
        where: { userId }
      });

      // Get new roles
      const roles = await tx.role.findMany({
        where: {
          name: { in: roleNames }
        }
      });

      if (roles.length !== roleNames.length) {
        const foundRoleNames = roles.map(r => r.name);
        const missingRoles = roleNames.filter(name => !foundRoleNames.includes(name));
        throw new Error(`Roles not found: ${missingRoles.join(', ')}`);
      }

      // Create new role assignments
      const userRoleData = roles.map(role => ({
        userId,
        roleId: role.id
      }));

      await tx.userRole.createMany({
        data: userRoleData
      });

      return {
        message: `Successfully replaced user roles`,
        newRoles: roleNames
      };
    });
  }
}

// Helper function for middleware/authentication
export const getUserRoles = async (userId: string): Promise<string[]> => {
  const userWithRoles = await UserRoleService.getUserWithRoles(userId);
  return userWithRoles?.userRoles.map(ur => ur.role.name) || [];
};

export default UserRoleService;