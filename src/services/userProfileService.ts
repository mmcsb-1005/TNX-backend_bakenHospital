import { prisma } from '../lib/prisma';

export class UserProfileService {
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        designation: true,
        requestedTrainings: {
          include: {
            training: true
          }
        }
      }
    });
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: {
    name?: string;
    email?: string;
    image?: string;
    position?: string;
    contactNumber?: string;
    designationId?: string;
  }) {
    // Check if email is unique (if being updated)
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    return await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        designation: true
      }
    });
  }

  /**
   * Get all designations for dropdown
   */
  static async getDesignations() {
    return await prisma.designation.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      throw new Error('User not found');
    }

    // Here you would verify the current password (using bcrypt)
    // const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    // if (!isValidPassword) {
    //   throw new Error('Current password is incorrect');
    // }

    // Hash new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

    return await prisma.user.update({
      where: { id: userId },
      data: {
        password: newPassword // In production, this should be hashed
      }
    });
  }

  /**
   * Get user's training history
   */
  static async getUserTrainingHistory(userId: string) {
    return await prisma.requestTraining.findMany({
      where: {
        participants: {
          some: {
            id: userId
          }
        }
      },
      include: {
        training: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        training: {
          dateTimeStart: 'desc'
        }
      }
    });
  }
}