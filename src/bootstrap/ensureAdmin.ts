import prisma from '../lib/prisma';
import { hashPasswordIfNeeded } from '../utils/password';
import { UserRole } from '@prisma/client';

export async function ensureAdmin() {
    const email = process.env.ADMIN_EMAIL || 'admin@system.com';
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
        console.warn('ensureAdmin: ADMIN_PASSWORD not set; skipping bootstrap');
        return;
    }
    const hashed = await hashPasswordIfNeeded(password);

    const existingUser = await prisma.user.findFirst({ where: { email, role: UserRole.ADMIN } });

    if (existingUser) {
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                password: hashed,
                role: UserRole.ADMIN,
                ...(existingUser.name ? {} : { name: 'System Admin' }),
            },
        });
        console.log(`ensureAdmin: bootstrap admin user updated -> ${email}`);
        return;
    }

    await prisma.user.create({
        data: {
            email,
            password: hashed,
            name: 'System Admin',
            role: UserRole.ADMIN,
        },
    });
    console.log(`ensureAdmin: bootstrap admin user created -> ${email}`);
}
