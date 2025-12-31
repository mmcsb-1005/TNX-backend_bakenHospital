import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../modules/auth/Auth.service";
import type { AuthenticatedUser } from "../modules/auth/Auth.model";

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization || '';
    console.log('Auth header received:', header);
    
    const [scheme, token] = header.split(' ');
    console.log('Scheme:', scheme, 'Token:', token ? 'exists' : 'missing');
    
    if (scheme !== 'Bearer' || !token) {
        console.log('Invalid auth format - scheme:', scheme, 'token present:', !!token);
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const payload = AuthService.verifyToken(token);
        console.log('Token verified successfully for user:', payload.email);
        req.user = payload;
        next();
    } catch (error) {
        console.log('Token verification failed:', error);
        return res.status(401).json({ message: 'Unauthorized v1.0. (Invalid or expired token', error: error, token: token , scheme: scheme, header: header });
    }
}