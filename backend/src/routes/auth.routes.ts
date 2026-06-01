import { Router } from 'express';
import { identifyTenant } from '../middlewares/identifyTenant';
import { asyncHandler } from '../utils/asyncHandler';
import { login } from '../controllers/auth.controller';

const router = Router();

// El login necesita el contexto del tenant (para acotar la búsqueda del usuario) pero NO un token.
router.post('/login', identifyTenant, asyncHandler(login));

export default router;
