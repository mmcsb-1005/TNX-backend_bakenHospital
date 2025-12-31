import prisma from '../lib/prisma';
import { hashPasswordIfNeeded } from '../utils/password';
import { UserRole } from '../../generated/prisma/client';

export async function ensureAdmin() {
    const adminExists = await prisma.user.count({ where: { role: UserRole.ADMIN } });
    if (adminExists > 0) return;

    // Why: autosetup in dev/CI; require password to avoid weak default.
    const email = process.env.ADMIN_EMAIL || 'admin@system.com';
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
        console.warn('ensureAdmin: ADMIN_PASSWORD not set; skipping bootstrap');
        return;
    }
    const hashed = await hashPasswordIfNeeded(password);
    await prisma.user.create({ 
        data: { 
            email, 
            password: hashed, 
            name: 'System Admin',
            role: UserRole.ADMIN 
        } 
    });
    console.log(`ensureAdmin: bootstrap admin user created -> ${email}`);
}