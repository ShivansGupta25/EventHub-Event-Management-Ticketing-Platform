import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { parsePagination } from '../lib/pagination.js';

const activeStatuses = ['PENDING_PAYMENT', 'CONFIRMED'];
const bookingSelect = {
  id: true,
  eventId: true,
  status: true,
  amountMinor: true,
  currency: true,
  eventSnapshot: true,
  holdExpiresAt: true,
  checkedInAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  event: {
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      venue: true,
      city: true,
      timezone: true,
      status: true,
    },
  },
};

function ticketCode() {
  return crypto.randomBytes(16).toString('base64url');
}

function findActiveBooking(client, eventId, userId) {
  return client.booking.findFirst({
    where: {
      eventId,
      userId,
      status: { in: activeStatuses },
    },
    select: bookingSelect,
  });
}

export async function createFreeBooking(eventId, userId) {
  const existingBooking = await findActiveBooking(prisma, eventId, userId);

  if (existingBooking) {
    return { booking: existingBooking, created: false };
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const lockedEvents = await transaction.$queryRaw`
        SELECT "id"
        FROM "Event"
        WHERE "id" = ${eventId}::uuid
        FOR UPDATE
      `;

      if (lockedEvents.length === 0) {
        throw new HttpError(404, 'EVENT_UNAVAILABLE', 'Event not found.');
      }

      const event = await transaction.event.findUnique({
        where: { id: eventId },
      });
      const currentBooking = await findActiveBooking(
        transaction,
        eventId,
        userId
      );

      if (currentBooking) {
        return { booking: currentBooking, created: false };
      }

      const now = new Date();

      if (
        event.status !== 'PUBLISHED' ||
        event.hiddenAt ||
        event.registrationClosesAt <= now ||
        event.startAt <= now
      ) {
        throw new HttpError(
          409,
          'REGISTRATION_CLOSED',
          'Registration for this event is closed.'
        );
      }

      if (event.priceMinor !== 0) {
        throw new HttpError(
          409,
          'PAID_BOOKING_REQUIRED',
          'This event requires a paid booking.'
        );
      }

      const activeBookingCount = await transaction.booking.count({
        where: {
          eventId,
          OR: [
            { status: 'CONFIRMED' },
            {
              status: 'PENDING_PAYMENT',
              holdExpiresAt: { gt: now },
            },
          ],
        },
      });

      if (activeBookingCount >= event.capacity) {
        throw new HttpError(
          409,
          'EVENT_FULL',
          'This event has no remaining seats.'
        );
      }

      const booking = await transaction.booking.create({
        data: {
          userId,
          eventId,
          status: 'CONFIRMED',
          amountMinor: 0,
          currency: event.currency,
          eventSnapshot: {
            title: event.title,
            startAt: event.startAt.toISOString(),
            endAt: event.endAt.toISOString(),
            venue: event.venue,
            address: event.address,
            city: event.city,
            timezone: event.timezone,
            priceMinor: event.priceMinor,
            currency: event.currency,
          },
          ticketCode: ticketCode(),
        },
        select: bookingSelect,
      });

      return { booking, created: true };
    });
  } catch (error) {
    if (error.code !== 'P2002') {
      throw error;
    }

    const booking = await findActiveBooking(prisma, eventId, userId);

    if (!booking) {
      throw error;
    }

    return { booking, created: false };
  }
}

export async function listUserBookings(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const where = { userId };

  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      select: bookingSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take: limit,
    }),
  ]);

  return {
    data: bookings,
    pagination: { page, limit, total },
  };
}

export async function getUserBooking(bookingId, userId) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    select: bookingSelect,
  });

  if (!booking) {
    throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  }

  return booking;
}

export async function getUserBookingTicket(bookingId, userId) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    select: { status: true, ticketCode: true },
  });

  if (!booking) {
    throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new HttpError(
      409,
      'BOOKING_NOT_CONFIRMED',
      'A ticket is available only for a confirmed booking.'
    );
  }

  return { ticketCode: booking.ticketCode };
}

export async function cancelUserBooking(bookingId, userId) {
  const bookingReference = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    select: { eventId: true },
  });

  if (!bookingReference) {
    throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  }

  return prisma.$transaction(async (transaction) => {
    const lockedEvents = await transaction.$queryRaw`
      SELECT "id"
      FROM "Event"
      WHERE "id" = ${bookingReference.eventId}::uuid
      FOR UPDATE
    `;

    if (lockedEvents.length === 0) {
      throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
    }

    const booking = await transaction.booking.findFirst({
      where: { id: bookingId, userId },
      select: {
        id: true,
        eventId: true,
        status: true,
        amountMinor: true,
        checkedInAt: true,
        cancelledAt: true,
        ticketCode: true,
      },
    });

    if (!booking) {
      throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
    }

    if (booking.status === 'CANCELLED') {
      return transaction.booking.findFirst({
        where: { id: bookingId, userId },
        select: bookingSelect,
      });
    }

    if (booking.amountMinor !== 0 || booking.status !== 'CONFIRMED') {
      throw new HttpError(
        409,
        'BOOKING_NOT_CANCELLABLE',
        'Only confirmed free bookings can be cancelled.'
      );
    }

    const event = await transaction.event.findUnique({
      where: { id: booking.eventId },
      select: { startAt: true },
    });

    if (booking.checkedInAt || event.startAt <= new Date()) {
      throw new HttpError(
        409,
        'BOOKING_NOT_CANCELLABLE',
        'A booking cannot be cancelled after check-in or after the event starts.'
      );
    }

    return transaction.booking.update({
      where: { id: booking.id, userId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        ticketCode: null,
      },
      select: bookingSelect,
    });
  });
}
