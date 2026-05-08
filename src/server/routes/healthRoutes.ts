import { Router, Request, Response } from 'express'

const router = Router()

/**
 * Health check endpoints for monitoring and load balancers
 */
router.get('/status', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    })
})

router.get('/ready', (_req: Request, res: Response) => {
    // Add readiness checks here (database, external services, etc.)
    const isReady = true
    
    if (isReady) {
        res.json({ ready: true })
    } else {
        res.status(503).json({ ready: false, reason: 'Dependencies not ready' })
    }
})

export default router
