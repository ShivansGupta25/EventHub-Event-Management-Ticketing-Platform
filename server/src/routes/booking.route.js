import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createBooking } from '../controllers/booking.controller.js';

// Owner: Person C. Mounted at /api, so define full paths:
// /events/:eventId/bookings, /bookings/..., /organizer/events/:eventId/check-ins, /payments/webhook
// The webhook receives a raw Buffer body (see app.js) for signature checks.
const router = Router();

router.post('/events/:eventId/bookings', requireAuth, createBooking);

export default router;
