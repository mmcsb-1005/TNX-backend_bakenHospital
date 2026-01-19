import { Request, Response, NextFunction } from 'express';
import { ApprovalUserService } from './ApprovalUser.service';

export class ApprovalUserController {
  private approvalUserService: ApprovalUserService;

  constructor() {
    this.approvalUserService = new ApprovalUserService();
  }

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

  getApprovalUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const approvalUser = await this.approvalUserService.getApprovalUserById(id);
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
      const approvalUser = await this.approvalUserService.updateApprovalUser(id, req.body);
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
      await this.approvalUserService.deleteApprovalUser(id);
      res.status(200).json({
        success: true,
        message: 'Approval user deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}