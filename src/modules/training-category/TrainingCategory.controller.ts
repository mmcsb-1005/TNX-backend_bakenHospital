import { Request, Response, NextFunction } from 'express';
import { TrainingCategoryService } from './TrainingCategory.service';
import { TrainingCategoryImportService } from './TrainingCategoryImport.service';
import { TrainingCategoryExportService } from './TrainingCategoryExport.service';

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
      const category = await this.trainingCategoryService.getTrainingCategoryById(id as string);
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
      const category = await this.trainingCategoryService.updateTrainingCategory(id as string, req.body);
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
      await this.trainingCategoryService.deleteTrainingCategory(id as string);
      res.status(200).json({
        success: true,
        message: 'Training category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Import training categories from CSV
  importTrainingCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body

      if (!data || !Array.isArray(data) || data.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No data provided for import'
        })
        return
      }

      const result = await TrainingCategoryImportService.importTrainingCategories(data)

      const statusCode = result.success ? 200 : 207 // 207 Multi-Status for partial success

      res.status(statusCode).json({
        success: result.success,
        data: result,
        message: result.success 
          ? `Successfully imported ${result.successCount} training category(s)`
          : `Imported ${result.successCount} training category(s) with ${result.failedCount} failure(s)`
      })
    } catch (error: any) {
      next(error)
    }
  };

  // Download CSV template
  downloadTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const headers = TrainingCategoryImportService.getTemplateHeaders()
      const sampleData = TrainingCategoryImportService.getSampleData()

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
      res.setHeader('Content-Disposition', 'attachment; filename=training-category-import-template.csv')
      res.send(csvContent)
    } catch (error: any) {
      next(error)
    }
  };

  // Export all training categories to CSV
  exportTrainingCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csvData = await TrainingCategoryExportService.exportToCsv()

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=training_categories_export_${new Date().toISOString().slice(0, 10)}.csv`)
      res.send(csvData)
    } catch (error: any) {
      next(error)
    }
  };
}