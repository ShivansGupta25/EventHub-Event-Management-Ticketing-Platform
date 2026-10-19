import {
  cancelUserBooking,
  createFreeBooking,
  getUserBooking,
  getUserBookingTicket,
  listUserBookings,
} from '../services/booking.service.js';
import { HttpError } from '../lib/errors.js';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createBooking(req, res) {
  const { eventId } = req.params;
  if (!uuidPattern.test(eventId)) {
    throw new HttpError(
      404,
      'EVENT_UNAVAILABLE',
      'Event not found or unavailable.'
    );
  }

  const { booking, created } = await createFreeBooking(eventId, req.user.id);
  return res.status(created ? 201 : 200).json({
    success: true,
    ticket: booking,
    data: booking,
  });
}

function validateBookingId(bookingId) {
  if (!uuidPattern.test(bookingId)) {
    throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  }
}

export async function listBookings(req, res) {
  const result = await listUserBookings(req.user.id, req.query);

  return res.status(200).json(result);
}

export async function getBooking(req, res) {
  validateBookingId(req.params.bookingId);
  const booking = await getUserBooking(req.params.bookingId, req.user.id);

  return res.status(200).json({ data: booking });
}

export async function getBookingTicket(req, res) {
  validateBookingId(req.params.bookingId);
  const ticket = await getUserBookingTicket(req.params.bookingId, req.user.id);

  return res.status(200).json({ data: ticket });
}

export async function cancelBooking(req, res) {
  validateBookingId(req.params.bookingId);
  const booking = await cancelUserBooking(req.params.bookingId, req.user.id);

  return res.status(200).json({ data: booking });
}
