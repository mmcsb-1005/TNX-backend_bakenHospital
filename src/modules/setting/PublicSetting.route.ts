import { Router } from 'express';
import { DataController } from './Setting.controller';

const router = Router();

/**
 * Public route to fetch all settings (for theme colors, logo, etc).
 * Accessible without authentication.
 */
router.get('/', DataController.getAllData); // #swagger.tags = ['Setting']

/**
 * Public route to fetch the logo path.
 * Accessible without authentication.
 */
router.get('/logo', DataController.getPublicLogoPath); // #swagger.tags = ['Setting']

export default router;