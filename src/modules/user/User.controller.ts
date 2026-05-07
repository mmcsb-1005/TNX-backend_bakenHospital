import { Request, Response } from 'express';
import { UserRepository } from './User.repository';
import { UserExportService } from './UserExport.service';
import { UserImportService } from './UserImport.service';
import { UserProfileService } from '../../services/userProfileService';
import { NotificationService } from '../notification/Notification.service';
import prisma from '../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getPublicUrlForObject, removeObject, tryExtractObjectPathFromPublicUrl, uploadObject } from '../../lib/supabaseAdmin';
import path from 'path';

interface UserController {
  getAllUser(req: Request, res: Response): Promise<void>;
  getUserById(req: Request, res: Response): Promise<void>;
  createUser(req: Request, res: Response): Promise<void>;
  updateUser(req: Request, res: Response): Promise<void>;
  deleteUser(req: Request, res: Response): Promise<void>;
  bulkDeleteUsers(req: Request, res: Response): Promise<void>;
  uploadPhoto(req: Request, res: Response): Promise<void>;
  uploadMyAvatar(req: Request, res: Response): Promise<void>;
  importUsers(req: Request, res: Response): Promise<void>;
  downloadTemplate(req: Request, res: Response): Promise<void>;
  // Profile-specific methods
  getMyProfile(req: Request, res: Response): Promise<void>;
  updateMyProfile(req: Request, res: Response): Promise<void>;
  changePassword(req: Request, res: Response): Promise<void>;
  getMyTrainingHistory(req: Request, res: Response): Promise<void>;
  getMyAttendance(req: Request, res: Response): Promise<void>;
  getDesignations(req: Request, res: Response): Promise<void>;
}

class UserControllerImpl implements UserController {
  async getAllUser(req: Request, res: Response): Promise<void> {
    const user = await UserRepository.getAllUser();
    res.json(user);
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const user = await UserRepository.getUserById(id);
    res.json(user);
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const data = req.body;
    const user = await UserRepository.createUser(data);
    
    // Create notification for all admins about new user registration
    try {
      // Get all admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });
      const adminUserIds = adminUsers.map((admin) => admin.id);
      
      if (adminUserIds.length > 0) {
        await NotificationService.createFromTemplate(
          'NEW_USER',
          {
            userName: user.name || 'Unknown User',
            userEmail: user.email || 'No email',
          },
          adminUserIds
        );
      }
    } catch (notificationError) {
      // Log error but don't fail user creation
      console.error('Failed to create notification for new user:', notificationError);
    }
    
    res.json(user);
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const User = await UserRepository.updateUser(id, data);
      res.json(User);
    } catch (error) {
      console.error('Update user error:', error);

      const message = error instanceof Error ? error.message : 'Failed to update user';

      if (message.includes('Unique constraint failed')) {
        res.status(409).json({ error: 'Staff ID already exists' });
        return;
      }

      if (message.includes('Foreign key constraint failed')) {
        res.status(400).json({ error: 'Selected designation or grade is invalid' });
        return;
      }

      if (message.includes('Record to update not found')) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(500).json({ error: message });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    await UserRepository.deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  }

  async bulkDeleteUsers(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'Please provide an array of user IDs to delete' });
        return;
      }

      const result = await UserRepository.bulkDeleteUsers(ids);
      res.json({ 
        message: `Successfully deleted ${result.deletedCount} users`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to delete users' 
      });
    }
  }

/**
 * swagger
 * /api/User/export:
 * get:
 * summary: Exports all User data to a CSV file.
 * tags: [User]
 * security:
 * - bearerAuth: []
 * responses:
 * '200':
 * description: CSV file containing all User records.
 * content:
 * text/csv:
 * example: "Full Name,Email,..."
 */
  async exportUser(req: Request, res: Response): Promise<void> {
    try {
      const csvData = await UserExportService.exportToCsv();

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=User_export_${new Date().toISOString().slice(0, 10)}.csv`);

      res.status(200).send(csvData);
    } catch (error) {
      console.error('User Export Error:', error);
      res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Failed to generate User export file.' 
      });
    }
  }

  async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const extractedExt = path.extname(req.file.originalname || '').toLowerCase();
      const extension = extractedExt && extractedExt.length <= 12 ? extractedExt : '';

      const objectPath = `staff-photos/${uuidv4()}${extension}`;
      await uploadObject({
        objectPath,
        body: req.file.buffer,
        contentType: req.file.mimetype,
      });

      const photoPath = getPublicUrlForObject(objectPath);
      const publicId = objectPath;

      res.json({
        success: true,
        data: {
          photoPath,
          publicId,
        },
        message: 'Photo uploaded successfully',
      });

      // NOTE: The photoPath URL still needs to be saved to the specific 
      // User member's 'image' field (as per your schema) in a separate 
      // PUT/PATCH API call, as this endpoint only handles the file upload.
      
    } catch (error) {
      console.error('User photo upload error:', error);
      const status =
        typeof (error as any)?.status === 'number' && (error as any).status >= 400 && (error as any).status < 600
          ? (error as any).status
          : 500
      res.status(status).json({
        error: error instanceof Error ? error.message : 'An error occurred during file upload.',
      });
    }
  }

  async uploadMyAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id as string | undefined
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' })
        return
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' })
        return
      }

      const extractedExt = path.extname(req.file.originalname || '').toLowerCase()
      const extension = extractedExt && extractedExt.length <= 12 ? extractedExt : ''

      const objectPath = `staff-photos/${userId}/${uuidv4()}${extension}`
      await uploadObject({
        objectPath,
        body: req.file.buffer,
        contentType: req.file.mimetype,
      })

      const image = getPublicUrlForObject(objectPath)

      const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      })

      const oldObjectPath = existing?.image ? tryExtractObjectPathFromPublicUrl(existing.image) : null
      if (oldObjectPath) {
        try {
          await removeObject(oldObjectPath)
        } catch (removeError) {
          const message = removeError instanceof Error ? removeError.message : String(removeError || '')
          const isNotFound =
            /not\s*found/i.test(message) || /no\s*such\s*key/i.test(message) || /\b404\b/.test(message)
          if (!isNotFound) {
            throw removeError
          }
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { image },
      })

      res.json({
        success: true,
        data: {
          image,
          publicId: objectPath,
          user: updatedUser,
        },
        message: 'Avatar uploaded successfully',
      })
    } catch (error) {
      console.error('User avatar upload error:', error)
      const status =
        typeof (error as any)?.status === 'number' && (error as any).status >= 400 && (error as any).status < 600
          ? (error as any).status
          : 500
      res.status(status).json({
        error: error instanceof Error ? error.message : 'An error occurred during file upload.',
      })
    }
  }

  // Import users from CSV
  async importUsers(req: Request, res: Response): Promise<void> {
    try {
      const { data } = req.body

      if (!data || !Array.isArray(data) || data.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No data provided for import'
        })
        return
      }

      const result = await UserImportService.importUsers(data)

      const statusCode = result.success ? 200 : 207 // 207 Multi-Status for partial success

      res.status(statusCode).json({
        success: result.success,
        data: result,
        message: result.success 
          ? `Successfully imported ${result.successCount} user(s)`
          : `Imported ${result.successCount} user(s) with ${result.failedCount} failure(s)`
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error importing users',
        error: error.message
      })
    }
  }

  // Download CSV template
  async downloadTemplate(req: Request, res: Response): Promise<void> {
    try {
      const headers = UserImportService.getTemplateHeaders()
      const sampleData = UserImportService.getSampleData()

      // Create CSV manually for more control
      const csvHeaders = headers.join(',')
      const csvRows = sampleData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || ''
          // Escape values that contain commas or quotes
          if (String(value).includes(',') || String(value).includes('"')) {
            return `"${String(value).replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
      
      const csvContent = [csvHeaders, ...csvRows].join('\n')

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename=user-import-template.csv')
      res.send(csvContent)
    } catch (error: any) {
      console.error('Error downloading template:', error)
      res.status(500).json({
        success: false,
        message: 'Error downloading template',
        error: error.message
      })
    }
  }

  // Profile-specific methods
  
  /**
   * Get current user's profile
   */
  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id; // Assuming middleware sets user
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const profile = await UserProfileService.getUserProfile(userId);
      
      if (!profile) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get user profile' 
      });
    }
  }

  /**
   * Update current user's profile
   */
  async updateMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { name, email, image, position, contactNumber, designationId } = req.body;
      
      const updatedProfile = await UserProfileService.updateUserProfile(userId, {
        name,
        email,
        image,
        position,
        contactNumber,
        designationId
      });

      res.json({ 
        message: 'Profile updated successfully',
        data: updatedProfile 
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400).json({ error: 'All password fields are required' });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({ error: 'New passwords do not match' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
      }

      await UserProfileService.changePassword(userId, currentPassword, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to change password' 
      });
    }
  }

  /**
   * Get user's training history
   */
  async getMyTrainingHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const trainingHistory = await UserProfileService.getUserTrainingHistory(userId);
      res.json(trainingHistory);
    } catch (error) {
      console.error('Get training history error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get training history' 
      });
    }
  }

  /**
   * Get user's attendance records
   */
  async getMyAttendance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const attendances = await UserProfileService.getUserAttendance(userId);
      res.json(attendances);
    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get attendance records' 
      });
    }
  }

  /**
   * Get all designations for dropdown
   */
  async getDesignations(req: Request, res: Response): Promise<void> {
    try {
      const designations = await UserProfileService.getDesignations();
      res.json(designations);
    } catch (error) {
      console.error('Get designations error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get designations' 
      });
    }
  }

}

export const UserController = new UserControllerImpl();
