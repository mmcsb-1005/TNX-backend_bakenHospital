import { Request, Response, NextFunction } from 'express';
import { DesignationService } from './Designation.service';

export class DesignationController {
  private designationService: DesignationService;

  constructor() {
    this.designationService = new DesignationService();
  }

  createDesignation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const designation = await this.designationService.createDesignation(req.body);
      res.status(201).json({
        success: true,
        data: designation,
        message: 'Designation created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getDesignations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const designations = await this.designationService.getDesignations();
      res.status(200).json({
        success: true,
        data: designations,
        message: 'Designations retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getDesignationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const designation = await this.designationService.getDesignationById(id);
      res.status(200).json({
        success: true,
        data: designation,
        message: 'Designation retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateDesignation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const designation = await this.designationService.updateDesignation(id, req.body);
      res.status(200).json({
        success: true,
        data: designation,
        message: 'Designation updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDesignation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.designationService.deleteDesignation(id);
      res.status(200).json({
        success: true,
        message: 'Designation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}