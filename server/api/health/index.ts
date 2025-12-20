import { Router } from 'express';

const router = Router();

// GET /api/health - Health check endpoint for Docker and monitoring
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
