import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPublicUrlForObject, uploadObject } from '../../lib/supabaseAdmin';

export class PaymentController {
  uploadReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const extension = req.file.originalname.includes('.')
        ? `.${req.file.originalname.split('.').pop()}`
        : '';

      const objectPath = `receipts/${uuidv4()}${extension}`;

      await uploadObject({
        objectPath,
        body: req.file.buffer,
        contentType: req.file.mimetype,
      });

      res.status(200).json({
        receiptPath: getPublicUrlForObject(objectPath),
        receiptOriginalName: req.file.originalname,
      });
    } catch (error) {
      next(error);
    }
  };

  getClaims = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        success: true,
        data: [],
        message: 'Payment claims retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  createClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json({
        success: true,
        message: 'Payment claim created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateClaimStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Payment claim status updated',
      });
    } catch (error) {
      next(error);
    }
  };
}
