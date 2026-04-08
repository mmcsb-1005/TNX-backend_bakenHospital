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

    // 2. Admin User Logic
    const adminExists = await prisma.user.count({
        where: { role: 'ADMIN' }
    });
    
    if (adminExists > 0) {
        console.log('ℹ️ Seed: admin user already exists, skipping');
    } else {
        const email = process.env.ADMIN_EMAIL || 'admin@example.com';
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        
        const hashed = await hashPasswordIfNeeded(password);
        const admin = await prisma.user.create({ 
            data: { 
                name: 'System Admin',
                email,
                password: hashed,
                role: 'ADMIN'
            } 
        });
        console.log(`✅ Seed: admin user created -> ${admin.email}`);
    }

    // 3. Seed Designations
    const designationCount = await prisma.designation.count();
    if (designationCount === 0) {
        const designations = [
            { name: 'Software Engineer', description: 'Develops and maintains software applications', level: 3 },
            { name: 'Senior Software Engineer', description: 'Senior level software development role', level: 5 },
            { name: 'Team Lead', description: 'Leads a team of developers', level: 6 },
            { name: 'Project Manager', description: 'Manages project delivery and coordination', level: 6 },
            { name: 'Business Analyst', description: 'Analyzes business requirements and processes', level: 4 },
            { name: 'Quality Assurance', description: 'Ensures quality of software products', level: 3 },
            { name: 'DevOps Engineer', description: 'Manages deployment and infrastructure', level: 4 },
            { name: 'UI/UX Designer', description: 'Designs user interfaces and experiences', level: 4 },
        ];

        for (const designation of designations) {
            await prisma.designation.create({ data: designation });
        }
        console.log('✅ Seed: designations created');
    } else {
        console.log('ℹ️ Designations already exist, skipping.');
    }

    // 4. Seed Training Categories
    const categoryCount = await prisma.trainingCategory.count();
    if (categoryCount === 0) {
        const categories = [
            { name: 'Technical Skills', description: 'Programming and technical competencies' },
            { name: 'Soft Skills', description: 'Communication and interpersonal skills' },
            { name: 'Leadership', description: 'Management and leadership development' },
            { name: 'Compliance', description: 'Regulatory and compliance training' },
            { name: 'Security', description: 'Information security and data protection' },
            { name: 'Project Management', description: 'Project management methodologies' },
        ];

        for (const category of categories) {
            await prisma.trainingCategory.create({ data: category });
        }
        console.log('✅ Seed: training categories created');
    } else {
        console.log('ℹ️ Training categories already exist, skipping.');
    }

    // 5. Seed Sample Users with Designations
    const userCount = await prisma.user.count({
        where: { role: 'USER' }
    });
    
    if (userCount < 5) {
        // Get some designations to assign to users
        const designations = await prisma.designation.findMany();
        
        const sampleUsers = [
            { name: 'John Doe', email: 'john@company.com', designationId: designations[0]?.id },
            { name: 'Jane Smith', email: 'jane@company.com', designationId: designations[1]?.id },
            { name: 'Mike Johnson', email: 'mike@company.com', designationId: designations[2]?.id },
            { name: 'Sarah Wilson', email: 'sarah@company.com', designationId: designations[3]?.id },
            { name: 'Tom Brown', email: 'tom@company.com', designationId: designations[4]?.id },
        ];

        for (const userData of sampleUsers) {
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            });
            
            if (!existingUser) {
                const hashedPassword = await hashPasswordIfNeeded('password123');
                await prisma.user.create({ 
                    data: { 
                        ...userData,
                        password: hashedPassword,
                        role: 'USER',
                        contactNumber: '+60123456789',
                        employmentDate: new Date()
                    } 
                });
            }
        }
        console.log('✅ Seed: sample users created');
    } else {
        console.log('ℹ️ Sample users already exist, skipping.');
    }

    // 6. Seed dummy request approval email template (for mail delivery testing)
    const requestApprovalTemplate = await prisma.mail.findFirst({
        where: { mailType: 'REQUEST_APPROVAL' as any }
    });

    if (!requestApprovalTemplate) {
        await prisma.mail.create({
            data: {
                name: 'Request Approval Dummy Template',
                subject: 'Approval Required: {{requestName}}',
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
                        <h2 style="margin: 0 0 14px; color: #111827;">Training Request Needs Your Approval</h2>
                        <p style="margin: 0 0 16px; color: #374151;">Hi {{approverName}}, this is a test template to verify email delivery.</p>
                        <p><strong>Request:</strong> {{requestName}}</p>
                        <p><strong>Training:</strong> {{trainingTitle}}</p>
                        <p><strong>Submitted By:</strong> {{submittedBy}}</p>
                        <p><strong>Submitted At:</strong> {{submittedAt}}</p>
                        <p><a href="{{approvalUrl}}">Open approval page</a></p>
                    </div>
                `,
                mailType: 'REQUEST_APPROVAL' as any,
                sendTrigger: 'MANUAL',
                templateVariables: {
                    approverName: 'Name of approver',
                    requestName: 'Request title',
                    trainingTitle: 'Training title',
                    submittedBy: 'Requester name',
                    submittedAt: 'Submission datetime',
                    approvalUrl: 'Approval page URL',
                },
                isActive: true,
            }
        });
        console.log('✅ Seed: request approval dummy mail template created');
    } else {
        console.log('ℹ️ Request approval mail template already exists, skipping.');
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