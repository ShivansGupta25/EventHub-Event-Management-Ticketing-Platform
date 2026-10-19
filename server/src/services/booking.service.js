import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';

// Bookings that hold a seat. Pending payments keep their seat until the provider confirms expiry.
export const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED'];

export async function createFreeBooking(eventId, userId) {
  return prisma.$transaction(async (tx) => {
    // Lock the event row so concurrent bookings for this event run one at a time.
    const [locked] = await tx.$queryRaw`
      SELECT "id" FROM "Event" WHERE "id" = ${eventId}::uuid FOR UPDATE
    `;
    const event =
      locked && (await tx.event.findUnique({ where: { id: eventId } }));

    if (!event || event.status === 'DRAFT' || event.hiddenAt) {
      throw new HttpError(
        404,
        'EVENT_UNAVAILABLE',
        'Event not found or unavailable.'
      );
    }
    if (event.status === 'CANCELLED') {
      throw new HttpError(
        409,
        'EVENT_UNAVAILABLE',
        'This event has been cancelled.'
      );
    }

    const existing = await tx.booking.findFirst({
      where: { eventId, userId, status: { in: ACTIVE_STATUSES } },
    });
    if (existing) return { booking: existing, created: false };

    if (event.registrationClosesAt <= new Date()) {
      throw new HttpError(
        409,
        'REGISTRATION_CLOSED',
        'Registration for this event is closed.'
      );
    }
    if (event.priceMinor > 0) {
      throw new HttpError(
        409,
        'PAYMENT_REQUIRED',
        'Paid checkout is not available yet.'
      );
    }

    const occupied = await tx.booking.count({
      where: { eventId, status: { in: ACTIVE_STATUSES } },
    });
    if (occupied >= event.capacity) {
      throw new HttpError(409, 'EVENT_SOLD_OUT', 'This event is sold out.');
    }

    const booking = await tx.booking.create({
      data: {
        userId,
        eventId,
        status: 'CONFIRMED',
        amountMinor: 0,
        currency: event.currency,
        eventSnapshot: {
          title: event.title,
          venue: event.venue,
          city: event.city,
          startAt: event.startAt,
          endAt: event.endAt,
          timezone: event.timezone,
        },
        ticketCode: crypto.randomBytes(16).toString('base64url'),
      },
    });
    return { booking, created: true };
  });
}
