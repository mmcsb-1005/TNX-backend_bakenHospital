import { Request, Response } from 'express';
import { AuthService } from './Auth.service';
import { AuthRepository } from './Auth.repository';
import { LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, AdminSignupRequest } from './Auth.model';

interface AuthController {
  login(req: Request, res: Response): Promise<void>;
  signupAdmin(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  profile(req: any, res: Response): Promise<void>;
  forgotPassword(req: Request, res: Response): Promise<void>; // NEW
  resetPassword(req: Request, res: Response): Promise<void>;
}

class AuthControllerImpl implements AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      
      // Validate required fields
      if (!loginData.email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      if (!loginData.password) {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      const result = await AuthService.login(loginData);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ 
        error: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  }

  async signupAdmin(req: Request, res: Response): Promise<void> {
    try {
      const data: AdminSignupRequest = req.body;

      if (!data.email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      if (!data.password) {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      const result = await AuthService.signupAdmin(data);
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Admin signup failed';
      const status = message.includes('already exists') || message.includes('already in use') ? 409 : 400;
      res.status(status).json({ error: message });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  }

  async profile(req: any, res: Response): Promise<void> {
    try {
      const { userId } = req.user;
      const user = await AuthRepository.findUserById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch profile' 
      });
    }
  }

  // NEW: Controller method to initiate password reset
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const data: ForgotPasswordRequest = req.body;
      
      if (!data.email || !data.appBaseUrl) {
        res.status(400).json({ error: 'Missing required fields: email or appBaseUrl' });
        return;
      }
      
      // The service handles finding the user and sending the email
      await AuthService.sendPasswordResetEmail(data);
      
      // CRITICAL: Send a success response regardless of whether the user was found.
      res.status(200).json({ 
        message: 'If the provided email is valid, a password reset link has been sent to the email address.' 
      });

    } catch (error) {
      // Catch errors thrown by the MailService (e.g., SMTP configuration failure)
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An internal error occurred while processing your request.' 
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const data: ResetPasswordRequest = req.body;
      
      if (!data.token || !data.newPassword) {
        res.status(400).json({ error: 'Missing required fields: token or newPassword.' });
        return;
      }
      
      if (data.newPassword.length < 8) {
          res.status(400).json({ error: 'New password must be at least 8 characters long.' });
          return;
      }

      await AuthService.resetPassword(data);
      
      res.status(200).json({ message: 'Password reset successful. You can now log in with your new password.' });

    } catch (error) {
      // Catch token errors (Invalid/Expired)
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'An error occurred during password reset.' 
      });
    }
  }
}

export const AuthController = new AuthControllerImpl();

