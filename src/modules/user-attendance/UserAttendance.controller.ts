import { Request, Response, NextFunction } from 'express';
import { UserAttendanceService } from './UserAttendance.service';
import { prisma } from '../../lib/prisma';

const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = (date: Date): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getTotalTrainingDays = (startDate: Date, endDate: Date): number => {
  const start = getStartOfDay(startDate);
  const end = getStartOfDay(endDate);
  const diffInMs = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1);
};

const getAttendanceDayNumber = (trainingStartDate: Date, attendanceDate: Date): number => {
  const start = getStartOfDay(trainingStartDate);
  const attendance = getStartOfDay(attendanceDate);
  const diffInMs = attendance.getTime() - start.getTime();
  return Math.max(1, Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1);
};

const getExpectedStartAt = (attendanceDate: Date, trainingStart: Date): Date => {
  const expected = new Date(attendanceDate);
  expected.setHours(
    trainingStart.getHours(),
    trainingStart.getMinutes(),
    trainingStart.getSeconds(),
    trainingStart.getMilliseconds()
  );
  return expected;
};

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
      const { qrData } = req.body; // QR data object from scanned QR code
      const userId = (req as any).user?.id; // Assuming user ID comes from auth middleware
      const now = new Date();

      if (!qrData || !qrData.trainingId || !qrData.token) {
        return res.status(400).json({
          success: false,
          message: 'Valid QR data is required',
        });
      }

      const { trainingId, token, date: qrDate } = qrData;

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

      // Validate QR code by checking against QrCode table
      const qrCodeRecord = await prisma.qrCode.findFirst({
        where: {
          trainingId: trainingId,
          token: token,
          expiresAt: {
            gt: new Date() // Not expired
          }
        },
        include: {
          training: true
        }
      })

      if (!qrCodeRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired QR code',
        });
      }

      // Determine attendance date - use QR code date
      const attendanceDate = getStartOfDay(qrCodeRecord.date);
      const setting = await prisma.setting.findFirst({
        select: { attendanceGraceMinutes: true },
      });
      const graceMinutes = setting?.attendanceGraceMinutes ?? 15;
      const expectedStartAt = getExpectedStartAt(attendanceDate, training.dateTimeStart);
      const lateCutoff = new Date(expectedStartAt.getTime() + graceMinutes * 60 * 1000);
      const isLate = now.getTime() > lateCutoff.getTime();
      const lateMinutes = isLate ? Math.ceil((now.getTime() - expectedStartAt.getTime()) / (60 * 1000)) : null;

      const trainingStartDate = getStartOfDay(training.dateTimeStart);
      const trainingEndDate = getStartOfDay(training.dateTimeEnd);
      const totalTrainingDays = getTotalTrainingDays(training.dateTimeStart, training.dateTimeEnd);

      if (attendanceDate < trainingStartDate || attendanceDate > trainingEndDate) {
        return res.status(400).json({
          success: false,
          message: 'QR code date is outside the training date range',
        });
      }

      const dayStart = getStartOfDay(attendanceDate);
      const dayEnd = getEndOfDay(attendanceDate);

      // Check if attendance for this training day is already marked
      const existingAttendance = await prisma.userAttendance.findFirst({
        where: {
          userId: userId,
          trainingId: trainingId,
          attendanceDate: {
            gte: dayStart,
            lte: dayEnd,
          },
        }
      });

      if (existingAttendance) {
        // Check if already scanned for this day
        if (existingAttendance.scannedAt) {
          return res.status(409).json({
            success: false,
            message: 'Attendance for today has already been marked via QR code',
            data: existingAttendance
          });
        }

        // Update existing attendance record
        const updatedAttendance = await prisma.userAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            isPresent: true,
            scannedAt: now,
            scannedVia: 'QR_CODE',
            expectedStartAt,
            isLate,
            lateMinutes,
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
                dateTimeEnd: true,
                venue: true,
              }
            }
          }
        });

        const attendedDays = await prisma.userAttendance.count({
          where: {
            userId,
            trainingId,
            isPresent: true,
          },
        });

        const attendanceDay = getAttendanceDayNumber(training.dateTimeStart, attendanceDate);

        return res.status(200).json({
          success: true,
          data: {
            ...updatedAttendance,
            attendanceDay,
            attendedDays,
            totalTrainingDays,
          },
          message: 'Attendance marked successfully',
        });
      }

      // Create new attendance record
      const newAttendance = await prisma.userAttendance.create({
        data: {
          userId: userId,
          trainingId: trainingId,
          attendanceDate,
          isPresent: true,
          scannedAt: now,
          scannedVia: 'QR_CODE',
          expectedStartAt,
          isLate,
          lateMinutes,
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
                dateTimeEnd: true,
                venue: true,
            }
          }
        }
      });


      const attendedDays = await prisma.userAttendance.count({
        where: {
          userId,
          trainingId,
          isPresent: true,
        },
      });

      const attendanceDay = getAttendanceDayNumber(training.dateTimeStart, attendanceDate);
      res.status(201).json({
        success: true,
        data: {
          ...newAttendance,
          attendanceDay,
          attendedDays,
          totalTrainingDays,
        },
        message: 'Attendance marked successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
