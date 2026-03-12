import { Request, Response, NextFunction } from 'express';
import { UserAttendanceService } from './UserAttendance.service';
import { prisma } from '../../lib/prisma';

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

  // Scan QR code for attendance
  scanQRCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trainingId, token } = req.body;
      const userId = (req as any).user?.id; // Assuming user ID comes from auth middleware

      if (!trainingId || !token) {
        return res.status(400).json({
          success: false,
          message: 'Training ID and token are required',
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Validate training and token
      const training = await prisma.training.findUnique({
        where: { id: trainingId }
      });

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found',
        });
      }

      if (!training.qrCodeToken || training.qrCodeToken !== token) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code',
        });
      }

      // Check if QR code is expired
      if (training.qrCodeExpiresAt && new Date() > training.qrCodeExpiresAt) {
        return res.status(410).json({
          success: false,
          message: 'QR code has expired',
        });
      }

      // Check if user is already registered for this training
      const existingAttendance = await prisma.userAttendance.findFirst({
        where: {
          userId: userId,
          trainingId: trainingId
        }
      });

      if (existingAttendance) {
        // Check if already scanned
        if (existingAttendance.scannedAt) {
          return res.status(409).json({
            success: false,
            message: 'Attendance already marked via QR code',
            data: existingAttendance
          });
        }

        // Update existing attendance record
        const updatedAttendance = await prisma.userAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            isPresent: true,
            scannedAt: new Date(),
            scannedVia: 'QR_CODE'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            training: {
              select: {
                id: true,
                title: true,
                dateTimeStart: true,
                dateTimeEnd: true
              }
            }
          }
        });

        return res.status(200).json({
          success: true,
          data: updatedAttendance,
          message: 'Attendance marked successfully',
        });
      }

      // Create new attendance record
      const newAttendance = await prisma.userAttendance.create({
        data: {
          userId: userId,
          trainingId: trainingId,
          attendanceDate: new Date(),
          isPresent: true,
          scannedAt: new Date(),
          scannedVia: 'QR_CODE'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          training: {
            select: {
              id: true,
              title: true,
              dateTimeStart: true,
              dateTimeEnd: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: newAttendance,
        message: 'Attendance marked successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}