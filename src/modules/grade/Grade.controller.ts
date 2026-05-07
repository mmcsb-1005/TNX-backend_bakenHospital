import { Request, Response, NextFunction } from 'express';
import { GradeService } from './Grade.service';

export class GradeController {
  private gradeService: GradeService;

  constructor() {
    this.gradeService = new GradeService();
  }

  createGrade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const grade = await this.gradeService.createGrade(req.body);
      res.status(201).json({
        success: true,
        data: grade,
        message: 'Grade created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getGrades = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const grades = await this.gradeService.getGrades();
      res.status(200).json({
        success: true,
        data: grades,
        message: 'Grades retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getGradeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const grade = await this.gradeService.getGradeById(id as string);
      res.status(200).json({
        success: true,
        data: grade,
        message: 'Grade retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateGrade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const grade = await this.gradeService.updateGrade(id as string, req.body);
      res.status(200).json({
        success: true,
        data: grade,
        message: 'Grade updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteGrade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.gradeService.deleteGrade(id as string);
      res.status(200).json({
        success: true,
        message: 'Grade deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

