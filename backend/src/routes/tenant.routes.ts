import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getTenants } from '../controllers/tenant.controller';

const router = Router();

// Public: no tenant header / token required (used by the login selector).
router.get('/', asyncHandler(getTenants));

export default router;
