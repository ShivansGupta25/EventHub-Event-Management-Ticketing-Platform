import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  getBooking,
  getBookingTicket,
  listBookings,
} from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/bookings', requireAuth, listBookings);
router.get('/bookings/:bookingId', requireAuth, getBooking);
router.get('/bookings/:bookingId/ticket', requireAuth, getBookingTicket);
router.post('/bookings/:bookingId/cancel', requireAuth, cancelBooking);
router.post('/events/:id/bookings', requireAuth, createBooking);

export default router;
