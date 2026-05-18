import { Router } from 'express'
import { DashboardController } from './Dashboard.controller'

const router = Router()
const controller = new DashboardController()

router.get('/stats', controller.getAdminStats)

export default router

