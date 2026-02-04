import { Router } from 'express';
import { DataController } from './Setting.controller';
import { logoUploadMiddleware, handleUploadError } from '../../middleware/imageUpload.middleware';

const router = Router();

// 1. Static Utility/Specific Routes
router.post('/upload-logo', logoUploadMiddleware, handleUploadError, DataController.uploadLogo);  // #swagger.tags = ['Setting']
router.put('/upsert', DataController.upsertData);   // #swagger.tags = ['Setting']
// 2. Variable Parameter Routes (e.g., GET/PUT/DELETE by ID)
router.get('/:id', DataController.getDataById);     // #swagger.tags = ['Setting']
router.put('/:id', DataController.updateData);      // #swagger.tags = ['Setting']
router.delete('/:id', DataController.deleteData);   // #swagger.tags = ['Setting']

// 3. Simple List and Creation Routes
router.get('/', DataController.getAllData);         // #swagger.tags = ['Setting']
router.post('/', DataController.createData);        // #swagger.tags = ['Setting']


export default router;