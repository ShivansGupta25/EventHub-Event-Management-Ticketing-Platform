import { prisma } from '../db.js';

function createBookingError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function findTicket(eventId, userId) {
  return prisma.ticket.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
  });
}

export async function createFreeBooking(eventId, userId) {
  const existingTicket = await findTicket(eventId, userId);

  if (existingTicket) {
    return { ticket: existingTicket, created: false };
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const updatedEvents = await transaction.$queryRaw`
        UPDATE "Event"
        SET "bookedCount" = "bookedCount" + 1
        WHERE "id" = ${eventId}::uuid
          AND "registrationOpen" = TRUE
          AND "bookedCount" < "capacity"
        RETURNING "id"
      `;

      if (updatedEvents.length === 0) {
        const ticket = await transaction.ticket.findUnique({
          where: {
            eventId_userId: { eventId, userId },
          },
        });

        if (ticket) {
          return { ticket, created: false };
        }

        const event = await transaction.event.findUnique({
          where: { id: eventId },
          select: {
            registrationOpen: true,
            bookedCount: true,
            capacity: true,
          },
        });

        if (!event) {
          throw createBookingError(404, 'Event not found.');
        }

        if (!event.registrationOpen) {
          throw createBookingError(
            409,
            'Registration for this event is closed.'
          );
        }

        throw createBookingError(409, 'This event has no remaining seats.');
      }

      const ticket = await transaction.ticket.create({
        data: { eventId, userId },
      });

      return { ticket, created: true };
    });
  } catch (error) {
    if (error.code !== 'P2002') {
      throw error;
    }

    const ticket = await findTicket(eventId, userId);

    if (!ticket) {
      throw error;
    }

    return { ticket, created: false };
  }
}
