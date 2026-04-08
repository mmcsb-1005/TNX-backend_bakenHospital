import { Request, Response } from 'express';
import { MailRepository } from './Mail.repository';
import { MailService } from './Mail.service';

interface DataController {
  getAllData(req: Request, res: Response): Promise<void>;
  getDataById(req: Request, res: Response): Promise<void>;
  createData(req: Request, res: Response): Promise<void>;
  updateData(req: Request, res: Response): Promise<void>;
  deleteData(req: Request, res: Response): Promise<void>;
  sendContactMessage(req: Request, res: Response): Promise<void>;
}

class DataControllerImpl implements DataController {
  private static readonly CACHE_TTL_MS = 60_000;
  private mailListCache: { data: unknown[]; expiresAt: number } | null = null;

  private invalidateMailListCache(): void {
    this.mailListCache = null;
  }

  getAllData = async (req: Request, res: Response): Promise<void> => {
    const now = Date.now();
    if (this.mailListCache && this.mailListCache.expiresAt > now) {
      res.json(this.mailListCache.data);
      return;
    }

    const result = await MailRepository.findAll();
    this.mailListCache = {
      data: result,
      expiresAt: now + DataControllerImpl.CACHE_TTL_MS,
    };

    res.json(result);
  }

  getDataById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const result = await MailRepository.findById(id);
    res.json(result);
  }

  createData = async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    const result = await MailRepository.create(data);
    this.invalidateMailListCache();
    res.json(result);
  }

  updateData = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const data = req.body;
    const result = await MailRepository.update(id, data);
    this.invalidateMailListCache();
    res.json(result);
  }

  deleteData = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await MailRepository.delete(id);
    this.invalidateMailListCache();
    res.json({ message: 'Mail deleted successfully' });
  }

  sendContactMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate required fields
      if (!name || !email || !subject || !message) {
        res.status(400).json({ 
          error: 'Missing required fields: name, email, subject, and message are required' 
        });
        return;
      }

      // Send email
      const result = await MailService.sendContactMessage(email, name, subject, message);
      
      res.json({ 
        success: true,
        message: 'Contact message sent successfully',
        messageId: result.messageId 
      });
    } catch (error: any) {
      console.error('Error sending contact message:', error);
      res.status(500).json({ 
        error: 'Failed to send contact message',
        details: error.message 
      });
    }
  }
}

export const DataController = new DataControllerImpl();