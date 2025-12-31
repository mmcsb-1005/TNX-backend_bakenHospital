import { Router } from 'express';
import { DataController } from './Mail.controller';

const router = Router();

// Contact message route (before other routes to avoid conflicts)
router.post('/contact', DataController.sendContactMessage);  // #swagger.tags = ['Mail']

// 1. Static Utility/Specific Routes
// 2. Variable Parameter Routes (e.g., GET/PUT/DELETE by ID)
router.get('/:id', DataController.getDataById);     // #swagger.tags = ['Mail']
router.put('/:id', DataController.updateData);      // #swagger.tags = ['Mail']
router.delete('/:id', DataController.deleteData);   // #swagger.tags = ['Mail']

// 3. Simple List and Creation Routes
router.get('/', DataController.getAllData);         // #swagger.tags = ['Mail']
router.post('/', DataController.createData);        // #swagger.tags = ['Mail']


export default router;