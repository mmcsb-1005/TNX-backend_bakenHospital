import express from 'express';
import cors from 'cors';
import { sync as globSync } from 'glob';
import fs from 'fs';
import path from 'path';

import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { errorHandler } from './middleware/error.middleware';

import AuthRoutes from './modules/auth/Auth.route'
import userRoutes from './modules/user/User.route'
import settingRoutes from './modules/setting/Setting.route'
import publicSettingRoutes from './modules/setting/PublicSetting.route'
import mailRoutes from './modules/mail/Mail.route'
import trainingRoutes from './modules/training/training.routes'
import formRoutes from './modules/form/form.routes'

// New admin routes
import designationRoutes from './modules/designation/Designation.route'
import trainingCategoryRoutes from './modules/training-category/TrainingCategory.route'
import requestTrainingRoutes from './modules/request-training/RequestTraining.route'
import approvalUserRoutes from './modules/approval-user/ApprovalUser.route'
import userAttendanceRoutes from './modules/user-attendance/UserAttendance.route'

import { requireAuth } from './middleware/auth.middleware'

const app = express();
app.use(cors());
app.use(express.json());
app.use('/training', express.static(path.join(__dirname, '../../frontend/public/training')));

// Swagger Documentation
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

// debug: expand globs and show files that will be scanned
const patterns = (options.apis as string[]).filter((p: string) => !p.startsWith('!'));
const matchedFiles: string[] = patterns.flatMap((p: string) => {
  try {
    return globSync(p, { nodir: true });
  } catch (e) {
    console.warn('glob sync failed for pattern', p, e);
    return [];
  }
});
//console.log('swagger-jsdoc will scan files:', matchedFiles);

let swaggerSpec;
try {
    swaggerSpec = swaggerJSDoc(options);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} catch (err) {
    console.error('swagger-jsdoc build error:', err);
    // Scan matched files for suspicious swagger/jsdoc/yaml markers
    for (const f of matchedFiles) {
        const txt = fs.readFileSync(f, 'utf8');
        if (/@swagger|@openapi|definitions:|components:|swagger:/.test(txt)) {
            console.log('file contains swagger-like content:', f);
        }
        if (/^\s*(definitions|components)\s*:\s*$(\r?\n\s*$)/m.test(txt)) {
            console.log('file possibly has an empty "definitions" or "components" block:', f);
        }
    }
    throw err;
}

// All Public API
app.use('/api/public/setting', publicSettingRoutes);

// Auth
app.use('/api/auth', AuthRoutes);

// All Protected API
app.use('/api/user', requireAuth, userRoutes);
app.use('/api/setting', requireAuth, settingRoutes);
app.use('/api/mail', requireAuth, mailRoutes);
app.use('/api/training', requireAuth, trainingRoutes);

// Admin API routes
app.use('/api/admin/designation', requireAuth, designationRoutes);
app.use('/api/admin/training-category', requireAuth, trainingCategoryRoutes);
app.use('/api/admin/request-training', requireAuth, requestTrainingRoutes);
app.use('/api/admin/approval-user', requireAuth, approvalUserRoutes);
app.use('/api/admin/user-attendance', requireAuth, userAttendanceRoutes);

// Form routes (admin and public)
app.use('/api', formRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(errorHandler);

app.get('/', (req, res) => {
    res.status(200).json('Connected to the server. Ver 1.0.0');
})

export default app;