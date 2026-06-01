import { Router } from 'express';
import { identifyTenant } from '../middlewares/identifyTenant';
import { checkAuth } from '../middlewares/checkAuth';
import { asyncHandler } from '../utils/asyncHandler';
import { getRecords, postRecord } from '../controllers/records.controller';

const router = Router();

// Every records route is tenant-scoped + authenticated.
// Order matters: identify the tenant, THEN validate the token against it.
router.use(identifyTenant);

// Reading: any authenticated role of the tenant.
router.get('/', checkAuth('ADMIN', 'USER'), asyncHandler(getRecords));

// Writing: restricted to ADMIN to showcase role-based access control.
router.post('/', checkAuth('ADMIN'), asyncHandler(postRecord));

export default router;
