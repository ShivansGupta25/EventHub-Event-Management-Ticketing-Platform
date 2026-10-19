import { createFreeBooking } from '../services/booking.service.js';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createBooking(req, res) {
  const { id: eventId } = req.params;

  if (!uuidPattern.test(eventId)) {
    return res.status(400).json({
      success: false,
      message: 'A valid event ID is required.',
    });
  }

  try {
    const result = await createFreeBooking(eventId, req.user.id);

    return res.status(result.created ? 201 : 200).json({
      success: true,
      ticket: result.ticket,
    });
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 409) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Booking creation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
}
