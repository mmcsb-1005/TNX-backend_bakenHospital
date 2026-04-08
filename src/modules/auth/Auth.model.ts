import prisma from "../../lib/prisma";

//const prisma = new PrismaClient();

export const User = prisma.user;
export const PasswordResetToken = prisma.passwordResetToken;

export interface LoginRequest {
  email: string;    // Email for all users
  password: string;
}

export interface AdminSignupRequest {
  name?: string;
  email: string;
  password: string;
}

export interface AdminSignupResponse {
  message: string;
  user: {
    id: string;
    email?: string;
    name?: string;
    role: string;
  };
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email?: string;
    name?: string;
    role: string;
  };
  token: string;
  redirectPath: string;
}

export interface JwtPayload {
  id: string;
  userId: string;
  email?: string;
  role: string;
}

export interface AuthenticatedUser extends JwtPayload {
  iat?: number;
  exp?: number;
}

export interface ForgotPasswordRequest {
  email: string; // The user's email
  appBaseUrl: string; // The base URL of your frontend app (e.g., https://myapp.com)
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

