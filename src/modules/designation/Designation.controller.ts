import { Request, Response, NextFunction } from 'express';
import { DesignationService } from './Designation.service';
import { DesignationImportService } from './DesignationImport.service';
import { DesignationExportService } from './DesignationExport.service';

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
      const designation = await this.designationService.getDesignationById(id as string);
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
      const designation = await this.designationService.updateDesignation(id as string, req.body);
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
      await this.designationService.deleteDesignation(id as string);
      res.status(200).json({
        success: true,
        message: 'Designation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Import designations from CSV
  importDesignations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body

      if (!data || !Array.isArray(data) || data.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No data provided for import'
        })
        return
      }

      const result = await DesignationImportService.importDesignations(data)

      const statusCode = result.success ? 200 : 207 // 207 Multi-Status for partial success

      res.status(statusCode).json({
        success: result.success,
        data: result,
        message: result.success 
          ? `Successfully imported ${result.successCount} designation(s)`
          : `Imported ${result.successCount} designation(s) with ${result.failedCount} failure(s)`
      })
    } catch (error: any) {
      next(error)
    }
  };

  // Download CSV template
  downloadTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const headers = DesignationImportService.getTemplateHeaders()
      const sampleData = DesignationImportService.getSampleData()

      // Create CSV manually for more control
      const csvHeaders = headers.join(',')
      const csvRows = sampleData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || ''
          // Escape values that contain commas or quotes
          if (String(value).includes(',') || String(value).includes('"')) {
            return `"${String(value).replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
      
      const csvContent = [csvHeaders, ...csvRows].join('\n')

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename=designation-import-template.csv')
      res.send(csvContent)
    } catch (error: any) {
      next(error)
    }
  };

  // Export all designations to CSV
  exportDesignations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csvData = await DesignationExportService.exportToCsv()

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=designations_export_${new Date().toISOString().slice(0, 10)}.csv`)
      res.send(csvData)
    } catch (error: any) {
      next(error)
    }
  };
}