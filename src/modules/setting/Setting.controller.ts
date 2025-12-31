import { Request, Response } from 'express';
import { DataRepository } from './Setting.repository';

interface DataController {
  getAllData(req: Request, res: Response): Promise<void>;
  getDataById(req: Request, res: Response): Promise<void>;
  createData(req: Request, res: Response): Promise<void>;
  updateData(req: Request, res: Response): Promise<void>;
  deleteData(req: Request, res: Response): Promise<void>;
  uploadLogo(req: Request, res: Response): Promise<void>;
  getPublicLogoPath(req: Request, res: Response): Promise<void>;
}

class DataControllerImpl implements DataController {
  async getAllData(req: Request, res: Response): Promise<void> {
    const result = await DataRepository.getAllData();
    res.json(result);
  }

  async getDataById(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const result = await DataRepository.getDataById(id);
    res.json(result);
  }

  async createData(req: Request, res: Response): Promise<void> {
    const data = req.body;
    const result = await DataRepository.createData(data);
    res.json(result);
  }

  async updateData(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const data = req.body;
    const result = await DataRepository.updateData(id, data);
    res.json(result);
  }

  async deleteData(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    await DataRepository.deleteData(id);
    res.json({ message: 'Setting deleted successfully' });
  }

  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // The 'path' property from multer-storage-cloudinary is the public URL
      const logoPath = (req.file as any).path; 
      // The 'filename' property holds the Cloudinary public_id
      const publicId = (req.file as any).filename;

      // Update the first setting record with the new logo URL
      const settings = await DataRepository.getAllData();
      if (settings && settings.length > 0) {
        // Assuming your Setting model has a field called 'logoPath'
        await DataRepository.updateData(settings[0].id, { logoPath });
      }

      res.json({ 
        message: 'Logo uploaded successfully',
        logoPath, // Returns the Cloudinary URL
        publicId, // Can be used for future deletion
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