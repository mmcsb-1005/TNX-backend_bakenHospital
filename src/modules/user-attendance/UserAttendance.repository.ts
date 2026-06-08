import { prisma } from '../../lib/prisma';
import { 
  CreateUserAttendanceInput, 
  UpdateUserAttendanceInput, 
  BulkUpdateAttendanceInput 
} from './UserAttendance.model';

const userAttendanceInclude = {
  training: true,
  user: {
    include: {
      designation: true,
      staffProfile: true,
    },
  },
};

export class UserAttendanceRepository {
  private prisma = prisma;

  constructor() {
  }

  private buildScannedAt(attendanceDate: Date, attendedTime?: string | null): Date | null {
    if (!attendedTime) return null;
    const match = attendedTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    const scannedAt = new Date(attendanceDate);
    scannedAt.setHours(hours, minutes, 0, 0);
    return scannedAt;
  }

  private getExpectedStartAt(attendanceDate: Date, trainingStart: Date): Date {
    const expected = new Date(attendanceDate);
    expected.setHours(
      trainingStart.getHours(),
      trainingStart.getMinutes(),
      trainingStart.getSeconds(),
      trainingStart.getMilliseconds()
    );
    return expected;
  }

  async create(data: CreateUserAttendanceInput) {
    return await this.prisma.userAttendance.create({
      data,
      include: userAttendanceInclude,
    });
  }

  async findAll() {
    return await this.prisma.userAttendance.findMany({
      include: userAttendanceInclude,
      orderBy: {
        attendanceDate: 'desc',
      },
    });
  }

  async findById(id: string) {
    return await this.prisma.userAttendance.findUnique({
      where: { id },
      include: userAttendanceInclude,
    });
  }

  async findByTrainingAndDate(trainingId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.prisma.userAttendance.findMany({
      where: {
        trainingId,
        attendanceDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: userAttendanceInclude,
    });
  }

  async findByTraining(trainingId: string) {
    return await this.prisma.userAttendance.findMany({
      where: { trainingId },
      include: userAttendanceInclude,
      orderBy: {
        attendanceDate: 'asc',
      },
    });
  }

  async update(id: string, data: UpdateUserAttendanceInput) {
    return await this.prisma.userAttendance.update({
      where: { id },
      data,
      include: userAttendanceInclude,
    });
  }

  async bulkUpdateByTrainingAndDate(
    trainingId: string, 
    date: Date, 
    data: BulkUpdateAttendanceInput
  ) {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const training = await this.prisma.training.findUnique({
      where: { id: trainingId },
      select: { dateTimeStart: true },
    });
    const expectedStartAt = training?.dateTimeStart
      ? this.getExpectedStartAt(normalizedDate, training.dateTimeStart)
      : null;
    const setting = await this.prisma.setting.findFirst({
      select: { attendanceGraceMinutes: true },
    });
    const graceMinutes = setting?.attendanceGraceMinutes ?? 15;

    const results = [];
    
    for (const attendance of data.attendances) {
      const scannedAt = attendance.isPresent
        ? this.buildScannedAt(normalizedDate, attendance.attendedTime)
        : null;

      const lateCutoff = expectedStartAt
        ? new Date(expectedStartAt.getTime() + graceMinutes * 60 * 1000)
        : null;
      const isLate =
        Boolean(attendance.isPresent && scannedAt && lateCutoff && scannedAt.getTime() > lateCutoff.getTime());
      const lateMinutes =
        isLate && expectedStartAt && scannedAt
          ? Math.ceil((scannedAt.getTime() - expectedStartAt.getTime()) / (60 * 1000))
          : null;

      const updateData: Record<string, unknown> = {
        isPresent: attendance.isPresent,
        comment: attendance.comment,
        ...(expectedStartAt ? { expectedStartAt } : {}),
      };

      if (!attendance.isPresent) {
        updateData.scannedAt = null;
        updateData.scannedVia = null;
        updateData.isLate = false;
        updateData.lateMinutes = null;
      } else {
        updateData.scannedAt = scannedAt;
        updateData.scannedVia = scannedAt ? "MANUAL" : null;
        updateData.isLate = isLate;
        updateData.lateMinutes = lateMinutes;
      }

      const createData: Record<string, unknown> = {
        trainingId,
        userId: attendance.userId,
        attendanceDate: normalizedDate,
        isPresent: attendance.isPresent,
        comment: attendance.comment,
        ...(expectedStartAt ? { expectedStartAt } : {}),
        scannedAt: scannedAt,
        scannedVia: scannedAt ? "MANUAL" : null,
        isLate,
        lateMinutes,
      };

      const result = await this.prisma.userAttendance.upsert({
        where: {
          trainingId_userId_attendanceDate: {
            trainingId,
            userId: attendance.userId,
            attendanceDate: normalizedDate,
          },
        },
        update: updateData as any,
        create: createData as any,
        include: userAttendanceInclude,
      });
      results.push(result);
    }
    
    return results;
  }

  async delete(id: string) {
    return await this.prisma.userAttendance.delete({
      where: { id },
    });
  }

  async getTrainingDates(trainingId: string) {
    const training = await this.prisma.training.findUnique({
      where: { id: trainingId },
      select: {
        dateTimeStart: true,
        dateTimeEnd: true,
      },
    });

    if (!training) {
      return [];
    }

    const dates = [];
    const currentDate = new Date(training.dateTimeStart);
    const endDate = new Date(training.dateTimeEnd);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  async getParticipantsByTraining(trainingId: string) {
    const requestTrainings = await this.prisma.requestTraining.findMany({
      where: { trainingId },
      include: {
        participants: {
          include: {
            designation: true,
          },
        },
      },
    });

    // Flatten all participants from all requests for this training
    const participants = requestTrainings.reduce((acc, request) => {
      return acc.concat(request.participants);
    }, [] as any[]);

    // Remove duplicates by user ID
    const uniqueParticipants = participants.filter(
      (participant, index, self) => 
        index === self.findIndex((p) => p.id === participant.id)
    );

    return uniqueParticipants;
  }
}
