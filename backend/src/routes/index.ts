import { Router } from 'express';
import authRoutes from './auth.routes';
import recordsRoutes from './records.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/records', recordsRoutes);

export default router;
