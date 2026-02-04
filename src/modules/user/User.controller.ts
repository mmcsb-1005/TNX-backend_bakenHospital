import { Request, Response } from 'express';
import { UserRepository } from './User.repository';
import { UserExportService } from './UserExport.service';
import { UserImportService } from './UserImport.service';

interface UserController {
  getAllUser(req: Request, res: Response): Promise<void>;
  getUserById(req: Request, res: Response): Promise<void>;
  createUser(req: Request, res: Response): Promise<void>;
  updateUser(req: Request, res: Response): Promise<void>;
  deleteUser(req: Request, res: Response): Promise<void>;
  bulkDeleteUsers(req: Request, res: Response): Promise<void>;
  uploadPhoto(req: Request, res: Response): Promise<void>;
  importUsers(req: Request, res: Response): Promise<void>;
  downloadTemplate(req: Request, res: Response): Promise<void>;
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
    const User = await UserRepository.createUser(data);
    res.json(User);
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const data = req.body;
    const User = await UserRepository.updateUser(id, data);
    res.json(User);
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
      console.log('Upload photo request received');
      console.log('File received:', !!req.file);
      
      if (!req.file) {
        console.log('No file in request');
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // The 'path' property from multer-storage-cloudinary is the public URL
      const photoPath = (req.file as any).path; 
      const publicId = (req.file as any).filename;

      console.log('Upload successful:', { photoPath, publicId });

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

}

export const UserController = new UserControllerImpl();
