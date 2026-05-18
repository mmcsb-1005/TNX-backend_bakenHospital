import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './Department.service';
import { DepartmentImportService } from './DepartmentImport.service';

export class DepartmentController {
  private departmentService: DepartmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  createDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const department = await this.departmentService.createDepartment(req.body);
      res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getDepartments = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const departments = await this.departmentService.getDepartments();
      res.status(200).json({
        success: true,
        data: departments,
        message: 'Departments retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const department = await this.departmentService.getDepartmentById(id as string);
      res.status(200).json({
        success: true,
        data: department,
        message: 'Department retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const department = await this.departmentService.updateDepartment(id as string, req.body);
      res.status(200).json({
        success: true,
        data: department,
        message: 'Department updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.departmentService.deleteDepartment(id as string);
      res.status(200).json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  importDepartments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body as any;

      if (!data || !Array.isArray(data) || data.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No data provided for import',
        });
        return;
      }

      const result = await DepartmentImportService.importDepartments(data);
      const statusCode = result.success ? 200 : 207;

      res.status(statusCode).json({
        success: result.success,
        data: result,
        message: result.success
          ? `Successfully imported ${result.successCount} department(s)`
          : `Imported ${result.successCount} department(s) with ${result.failedCount} failure(s)`,
      });
    } catch (error) {
      next(error);
    }
  };

  downloadTemplate = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const headers = DepartmentImportService.getTemplateHeaders();
      const sampleData = DepartmentImportService.getSampleData();

      const csvHeaders = headers.join(',');
      const csvRows = sampleData.map((row) =>
        headers
          .map((header) => {
            const value = (row as any)[header] || '';
            if (String(value).includes(',') || String(value).includes('"')) {
              return `"${String(value).replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(','),
      );

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=department-import-template.csv');
      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  };
}
