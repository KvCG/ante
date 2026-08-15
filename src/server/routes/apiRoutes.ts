import { Router } from 'express'
import healthRoutes from './healthRoutes'

const router = Router()

// Mount route modules
router.use('/', healthRoutes)

export default router
