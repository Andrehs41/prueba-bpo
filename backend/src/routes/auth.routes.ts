import { Router } from 'express';
import { identifyTenant } from '../middlewares/identifyTenant';
import { asyncHandler } from '../utils/asyncHandler';
import { login } from '../controllers/auth.controller';

const router = Router();

// Login needs the tenant context (to scope the user lookup) but NOT a token.
router.post('/login', identifyTenant, asyncHandler(login));

export default router;
