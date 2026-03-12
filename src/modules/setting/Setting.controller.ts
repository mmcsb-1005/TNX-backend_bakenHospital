import { Request, Response } from 'express';
import { DataRepository } from './Setting.repository';
import fs from 'fs';
import path from 'path';

interface DataController {
  getAllData(req: Request, res: Response): Promise<void>;
  getDataById(req: Request, res: Response): Promise<void>;
  createData(req: Request, res: Response): Promise<void>;
  updateData(req: Request, res: Response): Promise<void>;
  deleteData(req: Request, res: Response): Promise<void>;
  upsertData(req: Request, res: Response): Promise<void>;
  uploadLogo(req: Request, res: Response): Promise<void>;
  getPublicLogoPath(req: Request, res: Response): Promise<void>;
}

class DataControllerImpl implements DataController {
  async getAllData(req: Request, res: Response): Promise<void> {
    const result = await DataRepository.getAllData();
    res.json(result);
  }

  async getDataById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const result = await DataRepository.getDataById(id);
    res.json(result);
  }

  async createData(req: Request, res: Response): Promise<void> {
    const data = req.body;
    const result = await DataRepository.createData(data);
    res.json(result);
  }

  async updateData(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const data = req.body;
    const result = await DataRepository.updateData(id, data);
    res.json(result);
  }

  /**
   * Upsert setting data - always updates first record or creates if none exists
   */
  async upsertData(req: Request, res: Response): Promise<void> {
    const data = req.body;
    const result = await DataRepository.upsertData(data);
    res.json(result);
  }

  async deleteData(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    await DataRepository.deleteData(id);
    res.json({ message: 'Setting deleted successfully' });
  }

  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // The 'path' from multer is now a local server path. We need the public-facing URL.
      const logoPath = `/logo/${req.file.filename}`;

      // The 'filename' property holds the unique filename
      const publicId = req.file.filename; // For local storage, this is just the filename

      // Get existing settings to check for old logo
      const settings = await DataRepository.getAllData();
      let updatedSetting;
      
      if (settings && settings.length > 0) {
        // Delete old logo file if it exists
        const oldLogoPath = settings[0].logoPath;
        if (oldLogoPath) {
          // Extract filename from path (e.g., /logo/filename.png -> filename.png)
          const oldFilename = oldLogoPath.split('/').pop();
          if (oldFilename) {
            // Construct full file path (from backend/src -> frontend/public/logo)
            const oldFilePath = path.join(__dirname, '../../../frontend/public/logo', oldFilename);
            
            // Delete the old file if it exists
            if (fs.existsSync(oldFilePath)) {
              try {
                fs.unlinkSync(oldFilePath);
                console.log('Old logo deleted:', oldFilePath);
              } catch (deleteError) {
                console.error('Error deleting old logo:', deleteError);
                // Continue even if delete fails - don't block the upload
              }
            }
          }
        }
        
        // Update existing record
        updatedSetting = await DataRepository.updateData(settings[0].id, { logoPath });
      } else {
        // Create new record with just the logo path
        updatedSetting = await DataRepository.createData({ logoPath });
      }

      res.json({ 
        message: 'Logo uploaded successfully',
        logoPath, // Returns the public URL path e.g., /logo/image.png
        publicId, // Returns the filename
        setting: updatedSetting, // Return the full updated setting
      });

    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An error occurred during file upload.'
      });
    }
  }

  async getPublicLogoPath(req: Request, res: Response): Promise<void> {
    try {
      const logoPath = await DataRepository.getLogoPath();
      
      if (!logoPath) {
        // Return a 404 if no logo path exists in the database
        res.status(404).json({ error: 'Logo not found' });
        return;
      }
      
      res.json({ logoPath });
    } catch (error) {
      console.error('Get public logo error:', error);
      res.status(500).json({ error: 'Failed to fetch logo path' });
    }
  }

}

export const DataController = new DataControllerImpl();