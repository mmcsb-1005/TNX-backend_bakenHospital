import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { hashPasswordIfNeeded } from '../src/utils/password';

async function main() {
  console.log('--- Starting Seed Process ---');

  await prisma.$transaction([
    prisma.formSubmission.deleteMany(),
    prisma.formField.deleteMany(),
    prisma.form.deleteMany(),
    prisma.paymentClaim.deleteMany(),
    prisma.userAttendance.deleteMany(),
    prisma.trainingBookmark.deleteMany(),
    prisma.qrCode.deleteMany(),
    prisma.requestTraining.deleteMany(),
    prisma.approvalUserApprover.deleteMany(),
    prisma.approvalUser.deleteMany(),
    prisma.training.deleteMany(),
    prisma.trainingCategory.deleteMany(),
    prisma.staffProfile.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.mail.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.designation.deleteMany(),
    prisma.department.deleteMany(),
    prisma.systemLicense.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const defaultPassword = await hashPasswordIfNeeded(process.env.SEED_DEFAULT_PASSWORD || 'password123');

  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: process.env.ADMIN_EMAIL || 'admin@mmcsb.com',
      userOrgId: process.env.ADMIN_USERORGID || 'admin',
      password: defaultPassword,
      role: 'ADMIN',
    },
  });

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
