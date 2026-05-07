import { Router } from 'express';
import { UserController } from './User.controller';
import { staffPhotoUploadMiddleware, handleUploadError } from '../../middleware/imageUpload.middleware';
import { csvImportMiddleware } from '../../middleware/csvImport.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// 1. Static Utility/Specific Routes
router.post('/upload-photo', staffPhotoUploadMiddleware, handleUploadError, UserController.uploadPhoto); // #swagger.tags = ['User']
router.get('/export', UserController.exportUser);
router.get('/template/download', UserController.downloadTemplate); // #swagger.tags = ['User']
router.post('/import', csvImportMiddleware, UserController.importUsers); // #swagger.tags = ['User']
router.delete('/bulk', UserController.bulkDeleteUsers); // #swagger.tags = ['User']

// Profile-specific routes (require authentication)
router.post('/profile/upload-avatar', authMiddleware, staffPhotoUploadMiddleware, handleUploadError, UserController.uploadMyAvatar); // #swagger.tags = ['User Profile']
router.get('/profile/me', authMiddleware, UserController.getMyProfile); // #swagger.tags = ['User Profile']
router.put('/profile/me', authMiddleware, UserController.updateMyProfile); // #swagger.tags = ['User Profile']
router.post('/profile/change-password', authMiddleware, UserController.changePassword); // #swagger.tags = ['User Profile']
router.get('/profile/training-history', authMiddleware, UserController.getMyTrainingHistory); // #swagger.tags = ['User Profile']
router.get('/attendance/me', authMiddleware, UserController.getMyAttendance); // #swagger.tags = ['User Profile']
router.get('/designations', UserController.getDesignations); // #swagger.tags = ['User Profile']

// 2. Variable Parameter Routes (e.g., GET/PUT/DELETE by ID)
router.get('/:id', UserController.getUserById);   // #swagger.tags = ['User']
router.put('/:id', UserController.updateUser);    // #swagger.tags = ['User']
router.delete('/:id', UserController.deleteUser); // #swagger.tags = ['User']

// 3. Simple List and Creation Routes
router.get('/', UserController.getAllUser);       // #swagger.tags = ['User']
router.post('/', UserController.createUser);      // #swagger.tags = ['User']

export default router;
