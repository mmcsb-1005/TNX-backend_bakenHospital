import { Request, Response } from 'express';
import { DataRepository } from './Setting.repository';
import { v4 as uuidv4 } from 'uuid';
import { getPublicUrlForObject, uploadObject, removeObject, tryExtractObjectPathFromPublicUrl } from '../../lib/supabaseAdmin';
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

      const extractedExt = path.extname(req.file.originalname || '').toLowerCase();
      const extension = extractedExt && extractedExt.length <= 12 ? extractedExt : '';

      const objectPath = `logo/${uuidv4()}${extension}`;
      await uploadObject({
        objectPath,
        body: req.file.buffer,
        contentType: req.file.mimetype,
      });

      const logoPath = getPublicUrlForObject(objectPath);
      const publicId = objectPath;

      // Get existing settings to check for old logo
      const settings = await DataRepository.getAllData();
      let updatedSetting;
      
      if (settings && settings.length > 0) {
        const oldLogoPath = settings[0].logoPath;
        const oldObjectPath = oldLogoPath ? tryExtractObjectPathFromPublicUrl(oldLogoPath) : null;
        if (oldObjectPath) {
          try {
            await removeObject(oldObjectPath);
          } catch (removeError) {
            const message =
              removeError instanceof Error ? removeError.message : String(removeError || '');
            const isNotFound =
              /not\s*found/i.test(message) || /no\s*such\s*key/i.test(message) || /\b404\b/.test(message);
            if (!isNotFound) {
              throw removeError;
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
        success: true,
        data: {
          logoPath,
          publicId,
          setting: updatedSetting,
        },
        message: 'Logo uploaded successfully',
      });

    } catch (error) {
      console.error('Logo upload error:', error);
      const status =
        typeof (error as any)?.status === 'number' && (error as any).status >= 400 && (error as any).status < 600
          ? (error as any).status
          : 500
      const message = error instanceof Error ? error.message : 'An error occurred during file upload.'
      res.status(status).json({ error: message });
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
