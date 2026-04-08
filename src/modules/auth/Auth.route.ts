import { Router } from 'express';
import { AuthController } from './Auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// 1. Static Utility/Specific Routes
router.post('/login', (req, res) => AuthController.login(req, res));
router.post('/signup-admin', (req, res) => AuthController.signupAdmin(req, res));
router.post('/logout', (req, res) => AuthController.logout(req, res));
router.get('/profile', requireAuth, (req, res) => AuthController.profile(req, res));
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// 2. Variable Parameter Routes (e.g., GET/PUT/DELETE by ID)
// 3. Simple List and Creation Routes

export default router;

