import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getTenants } from '../controllers/tenant.controller';

const router = Router();

// Público: no requiere header de tenant ni token (lo usa el selector del login).
router.get('/', asyncHandler(getTenants));

export default router;
