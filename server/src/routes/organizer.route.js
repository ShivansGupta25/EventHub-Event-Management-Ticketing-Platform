import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createEvent,
  updateEvent,
  publishEvent,
} from '../controllers/organizer.controller.js';

const router = Router();

router.use(requireAuth, requireRole('ORGANIZER'));

router.post('/events', createEvent);
router.patch('/events/:id', updateEvent);
router.post('/events/:id/publish', publishEvent);

export default router;
