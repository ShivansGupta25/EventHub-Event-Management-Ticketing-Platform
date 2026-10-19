import { createFreeBooking } from '../services/booking.service.js';
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
  return res.status(created ? 201 : 200).json({ data: booking });
}
