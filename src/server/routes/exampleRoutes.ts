import { Router, Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { validateQuery } from '../middleware/validation'
import { requireFeature } from '../middleware/featureFlags'
import { exampleService } from '../services/exampleService'
import { z } from 'zod'

const router = Router()

// Validation schema
const exampleQuerySchema = z.object({
    limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 10),
    offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
})

/**
 * Example protected endpoint with validation
 * GET /api/example/items?limit=10&offset=0
 */
router.get(
    '/items',
    requireFeature('exampleFeature'),
    validateQuery(exampleQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { limit, offset } = req.validatedQuery as { limit: number; offset: number }
        const items = await exampleService.getItems({ limit, offset })
        res.json(items)
    })
)

/**
 * Example simple endpoint
 * GET /api/example/info
 */
router.get('/info', (_req: Request, res: Response) => {
    res.json({
        name: 'Example API',
        version: '1.0.0',
        description: 'Example route demonstrating patterns',
    })
})

export default router
