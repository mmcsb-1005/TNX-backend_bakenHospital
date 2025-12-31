import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { hashPasswordIfNeeded } from '../src/utils/password';

async function main() {
    console.log('--- Starting Seed Process ---');

    // 1. Ensure System License Exists (Merged Logic)
    const license = await prisma.systemLicense.findFirst();
    if (!license) {
        // Calculate an expiration date (e.g., 1 year from now)
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        await prisma.systemLicense.create({
            data: {
                licenseKey: 'DEFAULT-LICENSE-KEY-12345', // Added a default key as it is @unique
                maxUserCount: 10,
                expiresAt: oneYearFromNow,
                issuedTo: 'Initial Deployment',
                isActive: true,
            }
        });
        console.log('✅ Default system license created.');
    } else {
        console.log('ℹ️ System license already exists, skipping.');
    }

    // 2. Admin Logic
    const exists = await prisma.admin.count();
    if (exists > 0) {
        console.log('ℹ️ Seed: admin already exists, skipping');
    } else {
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD;
        
        if (!password) {
            throw new Error('ADMIN_PASSWORD is required for first initialization');
        }

        const hashed = await hashPasswordIfNeeded(password);
        const admin = await prisma.admin.create({ 
            data: { 
                username, 
                password: hashed 
            } 
        });
        console.log(`✅ Seed: admin created -> ${admin.username}`);
    }

    console.log('--- Seed Process Completed ---');
}

main()
    .catch((e) => { 
        console.error('❌ Seed Error:', e); 
        process.exit(1); 
    })
    .finally(async () => { 
        await prisma.$disconnect(); 
    });