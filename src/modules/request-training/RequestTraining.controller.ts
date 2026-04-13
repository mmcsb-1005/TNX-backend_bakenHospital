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
      const requestTraining = await this.requestTrainingService.getRequestTrainingById(id as string);
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
      const requestTraining = await this.requestTrainingService.updateRequestTraining(id as string, req.body);
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
      await this.requestTrainingService.deleteRequestTraining(id as string);
      res.status(200).json({
        success: true,
        message: 'Request training deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  approveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const actorUserId = (req as any).user?.id;
      if (!actorUserId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }
      const requestTraining = await this.requestTrainingService.approveRequest({
        requestId: id as string,
        notes,
        actorUserId,
      });
      res.status(200).json({
        success: true,
        data: requestTraining,
        message: 'Request approved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const actorUserId = (req as any).user?.id;
      if (!actorUserId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }
      const requestTraining = await this.requestTrainingService.rejectRequest({
        requestId: id as string,
        notes,
        actorUserId,
      });
      res.status(200).json({
        success: true,
        data: requestTraining,
        message: 'Request rejected successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getPendingRequestsForApprover = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id; // Get from JWT token
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }
      const requests = await this.requestTrainingService.getPendingRequestsForApprover(userId);
      res.status(200).json({
        success: true,
        data: requests,
        message: 'Pending requests retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getAllRequestsForApprover = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id; // Get from JWT token
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }
      const requests = await this.requestTrainingService.getAllRequestsForApprover(userId);
      res.status(200).json({
        success: true,
        data: requests,
        message: 'All requests retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getMyTrainings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id; // Get from JWT token
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }
      const trainings = await this.requestTrainingService.getMyTrainings(userId);
      res.status(200).json({
        success: true,
        data: trainings,
        message: 'My trainings retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getMyRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const requests = await this.requestTrainingService.getMyRequests(userId);
      res.status(200).json({
        success: true,
        data: requests,
        message: 'My requests retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  submitTrainingRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id; // Get from JWT token
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const requestTraining = await this.requestTrainingService.submitTrainingRequest({
        ...req.body,
        userId: userId, // Use authenticated user ID
      });

      res.status(201).json({
        success: true,
        data: requestTraining,
        message: 'Training request submitted successfully and is pending approval',
      });
    } catch (error) {
      next(error);
    }
  };

  sendNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.requestTrainingService.sendNotification(id as string);

      res.status(200).json({
        success: true,
        message: 'Email notification sent successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
