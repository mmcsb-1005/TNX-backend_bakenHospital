import { UserAttendanceRepository } from './UserAttendance.repository';
import { 
  CreateUserAttendanceInput, 
  UpdateUserAttendanceInput, 
  BulkUpdateAttendanceInput 
} from './UserAttendance.model';
import { prisma } from '../../lib/prisma';

export class UserAttendanceService {
  private userAttendanceRepository: UserAttendanceRepository;
  private prisma = prisma;

  constructor() {
    this.userAttendanceRepository = new UserAttendanceRepository();
  }

  async createUserAttendance(data: CreateUserAttendanceInput) {
    // Validate training exists
    const training = await this.prisma.training.findUnique({
      where: { id: data.trainingId },
    });
    if (!training) {
      throw new Error('Training not found');
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });
    if (!user) {
      throw new Error('User not found');
    }

    return await this.userAttendanceRepository.create(data);
  }

  async getUserAttendances() {
    return await this.userAttendanceRepository.findAll();
  }

  async getUserAttendanceById(id: string) {
    const attendance = await this.userAttendanceRepository.findById(id);
    if (!attendance) {
      throw new Error('User attendance not found');
    }
    return attendance;
  }

  async getUserAttendancesByTraining(trainingId: string) {
    // Validate training exists
    const training = await this.prisma.training.findUnique({
      where: { id: trainingId },
    });
    if (!training) {
      throw new Error('Training not found');
    }

    return await this.userAttendanceRepository.findByTraining(trainingId);
  }

  async getUserAttendancesByTrainingAndDate(trainingId: string, date: string) {
    // Validate training exists
    const training = await this.prisma.training.findUnique({
      where: { id: trainingId },
    });
    if (!training) {
      throw new Error('Training not found');
    }

    const attendanceDate = new Date(date);
    return await this.userAttendanceRepository.findByTrainingAndDate(trainingId, attendanceDate);
  }

  async updateUserAttendance(id: string, data: UpdateUserAttendanceInput) {
    // Check if attendance exists
    await this.getUserAttendanceById(id);

    return await this.userAttendanceRepository.update(id, data);
  }

  async bulkUpdateAttendance(trainingId: string, date: string, data: BulkUpdateAttendanceInput) {
    // Validate training exists
    const training = await this.prisma.training.findUnique({
      where: { id: trainingId },
    });
    if (!training) {
      throw new Error('Training not found');
    }

    const attendanceDate = new Date(date);
    return await this.userAttendanceRepository.bulkUpdateByTrainingAndDate(
      trainingId, 
      attendanceDate, 
      data
    );
  }

  async deleteUserAttendance(id: string) {
    // Check if attendance exists
    await this.getUserAttendanceById(id);

    return await this.userAttendanceRepository.delete(id);
  }

  async getTrainingWithDatesAndParticipants(trainingId: string) {
    // Validate training exists
    const training = await this.prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        category: true,
      },
    });
    if (!training) {
      throw new Error('Training not found');
    }

    // Get training dates
    const dates = await this.userAttendanceRepository.getTrainingDates(trainingId);
    
    // Get participants
    const participants = await this.userAttendanceRepository.getParticipantsByTraining(trainingId);

    // Get existing attendances
    const attendances = await this.userAttendanceRepository.findByTraining(trainingId);

    return {
      training,
      dates,
      participants,
      attendances,
    };
  }

  async getTrainingsWithAttendanceOverview() {
    const trainings = await this.prisma.training.findMany({
      include: {
        category: true,
        requestTrainings: {
          include: {
            participants: true,
          },
        },
        attendances: true,
      },
      orderBy: {
        dateTimeStart: 'desc',
      },
    });

    return trainings.map(training => {
      // Calculate total participants
      const totalParticipants = training.requestTrainings.reduce((acc, request) => {
        return acc + request.participants.length;
      }, 0);

      // Calculate dates count
      const startDate = new Date(training.dateTimeStart);
      const endDate = new Date(training.dateTimeEnd);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const datesCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Calculate attendance completion
      const expectedAttendanceRecords = totalParticipants * datesCount;
      const actualAttendanceRecords = training.attendances.length;
      const attendanceCompletionPercentage = expectedAttendanceRecords > 0 
        ? Math.round((actualAttendanceRecords / expectedAttendanceRecords) * 100) 
        : 0;

      return {
        id: training.id,
        title: training.title,
        organizer: training.organizer,
        dateTimeStart: training.dateTimeStart,
        dateTimeEnd: training.dateTimeEnd,
        category: training.category,
        totalParticipants,
        datesCount,
        attendanceCompletionPercentage,
        hasAttendanceData: actualAttendanceRecords > 0,
      };
    });
  }
}