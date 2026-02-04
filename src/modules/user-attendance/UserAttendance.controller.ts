import { Request, Response, NextFunction } from 'express';
import { UserAttendanceService } from './UserAttendance.service';

export class UserAttendanceController {
  private userAttendanceService: UserAttendanceService;

  constructor() {
    this.userAttendanceService = new UserAttendanceService();
  }

  createUserAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attendance = await this.userAttendanceService.createUserAttendance(req.body);
      res.status(201).json({
        success: true,
        data: attendance,
        message: 'User attendance created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getUserAttendances = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attendances = await this.userAttendanceService.getUserAttendances();
      res.status(200).json({
        success: true,
        data: attendances,
        message: 'User attendances retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getUserAttendanceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const attendance = await this.userAttendanceService.getUserAttendanceById(id as string);
      res.status(200).json({
        success: true,
        data: attendance,
        message: 'User attendance retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getUserAttendancesByTraining = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trainingId } = req.params;
      const attendances = await this.userAttendanceService.getUserAttendancesByTraining(trainingId as string);
      res.status(200).json({
        success: true,
        data: attendances,
        message: 'Training attendances retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getUserAttendancesByTrainingAndDate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trainingId, date } = req.params;
      const attendances = await this.userAttendanceService.getUserAttendancesByTrainingAndDate(
        trainingId as string, 
        date as string
      );
      res.status(200).json({
        success: true,
        data: attendances,
        message: 'Training attendances for date retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getTrainingWithDatesAndParticipants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trainingId } = req.params;
      const data = await this.userAttendanceService.getTrainingWithDatesAndParticipants(trainingId as string);
      res.status(200).json({
        success: true,
        data,
        message: 'Training with dates and participants retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getTrainingsWithAttendanceOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trainings = await this.userAttendanceService.getTrainingsWithAttendanceOverview();
      res.status(200).json({
        success: true,
        data: trainings,
        message: 'Trainings with attendance overview retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateUserAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const attendance = await this.userAttendanceService.updateUserAttendance(id as string, req.body);
      res.status(200).json({
        success: true,
        data: attendance,
        message: 'User attendance updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  bulkUpdateAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trainingId, date } = req.params;
      const attendances = await this.userAttendanceService.bulkUpdateAttendance(
        trainingId as string, 
        date as string, 
        req.body
      );
      res.status(200).json({
        success: true,
        data: attendances,
        message: 'Bulk attendance updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUserAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.userAttendanceService.deleteUserAttendance(id as string);
      res.status(200).json({
        success: true,
        message: 'User attendance deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}