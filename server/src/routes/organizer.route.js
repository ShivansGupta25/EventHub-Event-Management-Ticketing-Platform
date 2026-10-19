import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('ORGANIZER'));

export default router;
