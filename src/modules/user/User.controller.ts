import { Request, Response } from 'express';
import { UserRepository } from './User.repository';
import { UserExportService } from './UserExport.service';

interface UserController {
  getAllUser(req: Request, res: Response): Promise<void>;
  getUserById(req: Request, res: Response): Promise<void>;
  createUser(req: Request, res: Response): Promise<void>;
  updateUser(req: Request, res: Response): Promise<void>;
  deleteUser(req: Request, res: Response): Promise<void>;
  bulkDeleteUsers(req: Request, res: Response): Promise<void>;
  uploadPhoto(req: Request, res: Response): Promise<void>;
}

class UserControllerImpl implements UserController {
  async getAllUser(req: Request, res: Response): Promise<void> {
    const user = await UserRepository.getAllUser();
    res.json(user);
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const user = await UserRepository.getUserById(id);
    res.json(user);
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const data = req.body;
    const User = await UserRepository.createUser(data);
    res.json(User);
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const data = req.body;
    const User = await UserRepository.updateUser(id, data);
    res.json(User);
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
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

      // The 'path' property from multer-storage-cloudinary is the public URL
      const photoPath = (req.file as any).path; 
      const publicId = (req.file as any).filename;

      res.json({ 
        message: 'Photo uploaded successfully',
        photoPath, // Returns the Cloudinary URL
        publicId, // Can be used for future deletion
      });

      // NOTE: The photoPath URL still needs to be saved to the specific 
      // User member's 'image' field (as per your schema) in a separate 
      // PUT/PATCH API call, as this endpoint only handles the file upload.
      
    } catch (error) {
      console.error('User photo upload error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An error occurred during file upload.'
      });
    }
  }

}

export const UserController = new UserControllerImpl();
