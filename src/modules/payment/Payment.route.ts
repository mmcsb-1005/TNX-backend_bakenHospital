import { Router } from 'express';
import { PaymentController } from './Payment.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { receiptUploadMiddleware, handleUploadError } from '../../middleware/imageUpload.middleware';

const paymentController = new PaymentController();

const userRouter = Router();
userRouter.use(requireAuth);
userRouter.get('/claims', paymentController.getClaims);
userRouter.post('/claims', paymentController.createClaim);
userRouter.post('/upload-receipt', receiptUploadMiddleware, handleUploadError, paymentController.uploadReceipt);

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get('/claims', paymentController.getClaims);
adminRouter.put('/claims/:id', paymentController.updateClaimStatus);

export default { userRouter, adminRouter };
