import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createEvent,
  updateEvent,
  publishEvent,
  checkInTicket,
} from '../controllers/organizer.controller.js';

const router = Router();

router.use(requireAuth, requireRole('ORGANIZER'));

router.post('/events', createEvent);
router.patch('/events/:id', updateEvent);
router.post('/events/:id/publish', publishEvent);
router.post('/events/:eventId/check-ins', checkInTicket);

export default router;
