import { Request, Response, NextFunction } from 'express';
import { TrainingCategoryService } from './TrainingCategory.service';

export class TrainingCategoryController {
  private trainingCategoryService: TrainingCategoryService;

  constructor() {
    this.trainingCategoryService = new TrainingCategoryService();
  }

  createTrainingCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await this.trainingCategoryService.createTrainingCategory(req.body);
      res.status(201).json({
        success: true,
        data: category,
        message: 'Training category created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getTrainingCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.trainingCategoryService.getTrainingCategories();
      res.status(200).json({
        success: true,
        data: categories,
        message: 'Training categories retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getTrainingCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const category = await this.trainingCategoryService.getTrainingCategoryById(id);
      res.status(200).json({
        success: true,
        data: category,
        message: 'Training category retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateTrainingCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const category = await this.trainingCategoryService.updateTrainingCategory(id, req.body);
      res.status(200).json({
        success: true,
        data: category,
        message: 'Training category updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTrainingCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.trainingCategoryService.deleteTrainingCategory(id);
      res.status(200).json({
        success: true,
        message: 'Training category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}