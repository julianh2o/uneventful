import { Router } from 'express';
import authRouter from './auth';
import eventsRouter from './events';
import formsRouter from './forms';
import tasksRouter from './tasks';
import healthRouter from './health';
import errorsRouter from './errors';

const router = Router();

// Mount sub-routers
router.use('/auth', authRouter);
router.use('/events', eventsRouter);
router.use('/forms', formsRouter);
router.use('/tasks', tasksRouter);
router.use('/health', healthRouter);
router.use('/errors', errorsRouter);

export default router;
