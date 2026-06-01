import { Router } from 'express';
import { identifyTenant } from '../middlewares/identifyTenant';
import { checkAuth } from '../middlewares/checkAuth';
import { asyncHandler } from '../utils/asyncHandler';
import { getRecords, postRecord } from '../controllers/records.controller';

const router = Router();

// Toda ruta de records está acotada al tenant + autenticada.
// El orden importa: primero identificar el tenant, LUEGO validar el token contra él.
router.use(identifyTenant);

// Lectura: cualquier rol autenticado del tenant.
router.get('/', checkAuth('ADMIN', 'USER'), asyncHandler(getRecords));

// Escritura: restringida a ADMIN para demostrar el control de acceso basado en roles.
router.post('/', checkAuth('ADMIN'), asyncHandler(postRecord));

export default router;
