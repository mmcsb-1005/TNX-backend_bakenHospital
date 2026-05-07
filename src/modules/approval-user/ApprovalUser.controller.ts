import { Request, Response, NextFunction } from 'express';
import { ApprovalUserService } from './ApprovalUser.service';

/**
 * Controller untuk menguruskan proses kelulusan permintaan latihan
 * Mengendalikan CRUD operations untuk ApprovalUser entities
 */
export class ApprovalUserController {
  private approvalUserService: ApprovalUserService;

  constructor() {
    this.approvalUserService = new ApprovalUserService();
  }

  /**
   * Cipta rekod kelulusan baru untuk permintaan latihan
   * @param req.body - Data kelulusan (approvedById, requestTrainingId, status, dll.)
   */
  createApprovalUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approvalUser = await this.approvalUserService.createApprovalUser(req.body);
      res.status(201).json({
        success: true,
        data: approvalUser,
        message: 'Approval user created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Dapatkan semua rekod kelulusan
   * @returns Array of approval records
   */
  getApprovalUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approvalUsers = await this.approvalUserService.getApprovalUsers();
      res.status(200).json({
        success: true,
        data: approvalUsers,
        message: 'Approval users retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Dapatkan rekod kelulusan berdasarkan ID
   * @param req.params.id - ID rekod kelulusan
   */
  getApprovalUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const approvalUser = await this.approvalUserService.getApprovalUserById(id as string);
      res.status(200).json({
        success: true,
        data: approvalUser,
        message: 'Approval user retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateApprovalUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const approvalUser = await this.approvalUserService.updateApprovalUser(id as string, req.body);
      res.status(200).json({
        success: true,
        data: approvalUser,
        message: 'Approval user updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteApprovalUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.approvalUserService.deleteApprovalUser(id as string);
      res.status(200).json({
        success: true,
        message: 'Approval user deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}