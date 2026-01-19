import { Request, Response, NextFunction } from 'express';
import { RequestTrainingService } from './RequestTraining.service';

export class RequestTrainingController {
  private requestTrainingService: RequestTrainingService;

  constructor() {
    this.requestTrainingService = new RequestTrainingService();
  }

  createRequestTraining = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestTraining = await this.requestTrainingService.createRequestTraining(req.body);
      res.status(201).json({
        success: true,
        data: requestTraining,
        message: 'Request training created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getRequestTrainings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestTrainings = await this.requestTrainingService.getRequestTrainings();
      res.status(200).json({
        success: true,
        data: requestTrainings,
        message: 'Request trainings retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getRequestTrainingById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const requestTraining = await this.requestTrainingService.getRequestTrainingById(id);
      res.status(200).json({
        success: true,
        data: requestTraining,
        message: 'Request training retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateRequestTraining = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const requestTraining = await this.requestTrainingService.updateRequestTraining(id, req.body);
      res.status(200).json({
        success: true,
        data: requestTraining,
        message: 'Request training updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteRequestTraining = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.requestTrainingService.deleteRequestTraining(id);
      res.status(200).json({
        success: true,
        message: 'Request training deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}