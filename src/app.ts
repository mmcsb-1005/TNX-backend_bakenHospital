import express from 'express';
import cors from 'cors';
import path from 'path';

import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { errorHandler } from './middleware/error.middleware';

// Routes untuk authentication - login, register, logout
import AuthRoutes from './modules/auth/Auth.route'
// Routes untuk pengurusan pengguna - CRUD operations untuk user
import userRoutes from './modules/user/User.route'
// Routes untuk tetapan sistem - konfigurasi aplikasi
import settingRoutes from './modules/setting/Setting.route'
// Routes untuk tetapan awam - tetapan yang boleh diakses tanpa auth
import publicSettingRoutes from './modules/setting/PublicSetting.route'
// Routes untuk emel - penghantaran notifikasi emel
import mailRoutes from './modules/mail/Mail.route'
// Routes untuk latihan - pengurusan program latihan
import trainingRoutes from './modules/training/training.routes'
// Routes untuk borang dinamik - sistem borang untuk pengumpulan data
import formRoutes from './modules/form/form.routes'

// Routes admin baharu
// Routes untuk jawatan - pengurusan designation/position
import designationRoutes from './modules/designation/Designation.route'
// Routes untuk grade - pengurusan grade jawatan
import gradeRoutes from './modules/grade/Grade.route'
// Routes untuk department - pengurusan department untuk designation
import departmentRoutes from './modules/department/Department.route'
// Routes untuk permintaan latihan - pengguna memohon latihan
import requestTrainingRoutes from './modules/request-training/RequestTraining.route'
// Routes untuk kelulusan - proses approve/reject permintaan
import approvalUserRoutes from './modules/approval-user/ApprovalUser.route'
// Routes untuk kehadiran pengguna - tracking attendance latihan
import userAttendanceRoutes from './modules/user-attendance/UserAttendance.route'
import dashboardRoutes from './modules/dashboard/Dashboard.route'
// Routes untuk pembayaran - tuntutan bayaran latihan
import paymentRoutes from './modules/payment/Payment.route'
// Routes untuk notifikasi - sistem pemberitahuan
import notificationRoutes from './modules/notification/Notification.route'

import { requireAuth } from './middleware/auth.middleware'

// Setup aplikasi Express
const app = express();

// Middleware asas
app.use(cors()); // Enable CORS untuk cross-origin requests
app.use(express.json()); // Parse JSON body

// Static file serving untuk frontend assets
app.use('/qr-generate', express.static(path.join(__dirname, '../../frontend/public/qr-generate')));

// Konfigurasi Swagger untuk dokumentasi API
app.use('session', express.static('session'));
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'My API',
        version: '1.0.0',
        description: 'TNAPro API Documentation',
    },
    servers: [{ url: 'http://localhost:3001' }],
    // 👈 IMPORTANT: Define Security Scheme here once
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [{ bearerAuth: [] }], // Set global security default
};

const options = {
    definition: swaggerDefinition, // use "definition" for openapi v3
    // only scan controller files (reduce false positives)
    apis: ['./src/modules/**/*.ts'],
};

let swaggerSpec;
try {
    swaggerSpec = swaggerJSDoc(options);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} catch (err) {
    console.error('swagger-jsdoc build error:', err);
    throw err;
}

// ===========================
// API ROUTES
// ===========================

// Routes awam - tidak memerlukan authentication
app.use('/api/public/setting', publicSettingRoutes);

// Authentication routes
app.use('/api/auth', AuthRoutes);

// Routes yang dilindungi - memerlukan authentication JWT
app.use('/api/user', requireAuth, userRoutes);
app.use('/api/setting', requireAuth, settingRoutes);
app.use('/api/mail', requireAuth, mailRoutes);
app.use('/api/training', requireAuth, trainingRoutes);
app.use('/api/payment', requireAuth, paymentRoutes.userRouter);
app.use('/api/notifications', requireAuth, notificationRoutes);

// Admin API routes
app.use('/api/admin/designation', requireAuth, designationRoutes);
app.use('/api/admin/grade', requireAuth, gradeRoutes);
app.use('/api/admin/department', requireAuth, departmentRoutes);
app.use('/api/admin/request-training', requireAuth, requestTrainingRoutes);
app.use('/api/admin/approval-user', requireAuth, approvalUserRoutes);
app.use('/api/admin/user-attendance', requireAuth, userAttendanceRoutes);
app.use('/api/admin/payment', requireAuth, paymentRoutes.adminRouter);
app.use('/api/admin/dashboard', requireAuth, dashboardRoutes);

// Form routes (admin and public)
app.use('/api', formRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(errorHandler);

app.get('/', (req, res) => {
    res.status(200).json('Connected to the server. Ver 1.0.0');
})

export default app;
