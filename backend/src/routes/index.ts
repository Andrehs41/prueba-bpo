import { Router } from 'express';
import authRoutes from './auth.routes';
import recordsRoutes from './records.routes';
import tenantRoutes from './tenant.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/tenants', tenantRoutes);
router.use('/auth', authRoutes);
router.use('/records', recordsRoutes);

export default router;
