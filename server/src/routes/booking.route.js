import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  getBooking,
  getBookingTicket,
  listBookings,
} from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/auth.js';

// Owner: Person C. Mounted at /api, so define full paths:
// /events/:eventId/bookings, /bookings/..., /organizer/events/:eventId/check-ins, /payments/webhook
// The webhook receives a raw Buffer body (see app.js) for signature checks.
const router = Router();

router.get('/bookings', requireAuth, listBookings);
router.get('/bookings/:bookingId', requireAuth, getBooking);
router.get('/bookings/:bookingId/ticket', requireAuth, getBookingTicket);
router.post('/bookings/:bookingId/cancel', requireAuth, cancelBooking);
router.post('/events/:eventId/bookings', requireAuth, createBooking);

export default router;
