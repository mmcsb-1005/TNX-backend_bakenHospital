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
    const results = [];
    
    for (const attendance of data.attendances) {
      const result = await this.prisma.userAttendance.upsert({
        where: {
          trainingId_userId_attendanceDate: {
            trainingId,
            userId: attendance.userId,
            attendanceDate: date,
          },
        },
        update: {
          isPresent: attendance.isPresent,
          comment: attendance.comment,
        },
        create: {
          trainingId,
          userId: attendance.userId,
          attendanceDate: date,
          isPresent: attendance.isPresent,
          comment: attendance.comment,
        },
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
