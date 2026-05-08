import { Router } from 'express'
import healthRoutes from './healthRoutes'
import exampleRoutes from './exampleRoutes'

const router = Router()

// Mount route modules
router.use('/', healthRoutes)
router.use('/example', exampleRoutes)

export default router
