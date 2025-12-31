import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // Import for secure token generation
import { AuthRepository } from './Auth.repository';
import { JwtPayload, LoginRequest, LoginResponse, ForgotPasswordRequest, ResetPasswordRequest, PasswordResetToken } from './Auth.model';
import { MailService } from '../mail/Mail.service'; // Import the MailService
import { MailType } from '../../../generated/prisma/client'; // Import MailType enum

interface AuthService {
  login(loginData: LoginRequest): Promise<LoginResponse>;
  generateToken(payload: JwtPayload): string;
  verifyToken(token: string): JwtPayload;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
  generateRandomPassword(length?: number): string;
  sendPasswordResetEmail(data: ForgotPasswordRequest): Promise<void>;
  resetPassword(data: ResetPasswordRequest): Promise<void>;
}

class AuthServiceImpl implements AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: number;

  constructor() {
    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = 604800;
  }

  async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    if (!user.password) {
      throw new Error('No password set for this account');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = this.generateToken(tokenPayload);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  }

  generateToken(payload: JwtPayload): string {
    try {
      return jwt.sign(
        payload as Record<string, any>, 
        this.jwtSecret,
        { expiresIn: this.jwtExpiresIn }
      );
    } catch (error) {
      throw new Error('Failed to generate token');
    }
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // NEW: Implement the password reset email sending logic
  async sendPasswordResetEmail(data: ForgotPasswordRequest): Promise<void> {
    const { email, appBaseUrl } = data;

    // 1. Find the user
    const user = await AuthRepository.findUserByEmail(email);

    if (!user) {
      // CRITICAL SECURITY STEP: Do NOT throw an error or reveal the user doesn't exist.
      // This prevents bots from harvesting valid emails.
      console.warn(`Attempted password reset for unknown email: ${email}`);
      return; // Exit gracefully, but let the controller return success message.
    }

    // 2. Generate secure token (e.g., 64 characters long)
    const token = crypto.randomBytes(32).toString('hex');
    
    // 3. Define token expiry (1 hour)
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 1);

    // 4. Store the token
    await AuthRepository.createResetToken(user.id, token, expiryTime);

    // 5. Construct the full reset link for the template
    const resetUrl = `${appBaseUrl}/reset-password?token=${token}`;
    
    // 6. Define recipient and template variables
    const recipientEmail = user.email;
    const userName = user.name || 'User';

    try {
        await MailService.sendTemplateMail(
            MailType.PASSWORD_RESET,
            recipientEmail, 
            {
                "user.name": userName,
                "reset.link": resetUrl,
                "app.url": appBaseUrl
            }
        );
    } catch (mailError) {
        console.error(`Failed to send password reset email to ${recipientEmail}:`, mailError);
        // Throw a specific error for external systems to handle
        throw new Error('Failed to send password reset email. Please ensure the email configuration is correct.');
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const { token, newPassword } = data;

    // 1. Validate the token
    const resetTokenRecord = await AuthRepository.findValidResetToken(token);

    if (!resetTokenRecord) {
        throw new Error('Invalid or expired password reset token.');
    }

    // 2. Hash the new password (using existing utility)
    const hashedPassword = await this.hashPassword(newPassword);

    // 3. Update the user's password
    await AuthRepository.updateUserPassword(
        resetTokenRecord.userId, 
        hashedPassword
    );

    // 4. Delete the used token (critical for security)
    await PasswordResetToken.delete({
        where: { id: resetTokenRecord.id },
    });
  }
}

export const AuthService = new AuthServiceImpl();


