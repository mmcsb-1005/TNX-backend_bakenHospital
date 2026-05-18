import { Router } from 'express';
import { PaymentController } from './Payment.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { receiptUploadMiddleware, handleUploadError } from '../../middleware/imageUpload.middleware';

const paymentController = new PaymentController();

const userRouter = Router();
userRouter.use(requireAuth);
userRouter.get('/claims', paymentController.getClaims);
userRouter.get('/my-claims', paymentController.getMyClaims);
userRouter.get('/training/:trainingId/my-claim', paymentController.getMyClaimForTraining);
userRouter.post('/claims', paymentController.createClaim);
userRouter.post('/upload-receipt', receiptUploadMiddleware, handleUploadError, paymentController.uploadReceipt);

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get('/', paymentController.getClaims);
adminRouter.get('/claims', paymentController.getClaims);
adminRouter.get('/report/summary', paymentController.getSummary);
adminRouter.post('/claims', paymentController.createClaim);
adminRouter.post('/upload-receipt', receiptUploadMiddleware, handleUploadError, paymentController.uploadReceipt);
adminRouter.patch('/:id/verify', paymentController.verifyClaim);
adminRouter.patch('/:id/reject', paymentController.rejectClaim);
adminRouter.patch('/:id/mark-paid', paymentController.markPaid);
adminRouter.put('/claims/:id', paymentController.updateClaimStatus);

export default { userRouter, adminRouter };
