import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';

const EVENT_FIELDS = [
  'title',
  'description',
  'category',
  'coverKey',
  'venue',
  'address',
  'city',
  'timezone',
  'startAt',
  'endAt',
  'registrationClosesAt',
  'capacity',
  'priceMinor',
  'currency',
];

const REQUIRED_FIELDS = [
  'title',
  'description',
  'category',
  'venue',
  'address',
  'city',
  'timezone',
  'startAt',
  'endAt',
  'registrationClosesAt',
  'capacity',
  'priceMinor',
  'currency',
];

const STRING_LIMITS = {
  title: 150,
  description: 5000,
  category: 50,
  venue: 150,
  address: 300,
  city: 100,
  timezone: 64,
  currency: 3,
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalidInput(message, fields = {}) {
  throw new HttpError(400, 'VALIDATION_ERROR', message, fields);
}

function validateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    invalidInput('Request body must be a JSON object.');
  }
}

function parseDate(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    invalidInput(`Invalid ${field}.`, {
      [field]: 'A valid date is required.',
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    invalidInput(`Invalid ${field}.`, {
      [field]: 'A valid date is required.',
    });
  }

  return date;
}

function validateEventFields(body, { partial = false } = {}) {
  const errors = {};
  const cleaned = {};

  if (!partial) {
    for (const field of REQUIRED_FIELDS) {
      if (body[field] === undefined) {
        errors[field] = 'This field is required.';
      }
    }
  }

  for (const field of EVENT_FIELDS) {
    if (body[field] === undefined) {
      continue;
    }

    const value = body[field];

    if (Object.hasOwn(STRING_LIMITS, field)) {
      if (typeof value !== 'string' || value.trim() === '') {
        errors[field] = 'Must be a non-empty string.';
        continue;
      }

      const normalized =
        field === 'currency' ? value.trim().toUpperCase() : value.trim();

      if (normalized.length > STRING_LIMITS[field]) {
        errors[field] = `Must not exceed ${STRING_LIMITS[field]} characters.`;
        continue;
      }

      if (field === 'currency' && !/^[A-Z]{3}$/.test(normalized)) {
        errors[field] = 'Must be a three-letter currency code.';
        continue;
      }

      cleaned[field] = normalized;
      continue;
    }

    if (field === 'coverKey') {
      if (value !== null && (typeof value !== 'string' || value.length > 100)) {
        errors[field] = 'Must be a string of at most 100 characters or null.';
      } else {
        cleaned[field] = value;
      }

      continue;
    }

    if (
      field === 'startAt' ||
      field === 'endAt' ||
      field === 'registrationClosesAt'
    ) {
      try {
        cleaned[field] = parseDate(value, field);
      } catch (error) {
        errors[field] = error.message;
      }

      continue;
    }

    if (field === 'capacity') {
      if (!Number.isInteger(value) || value < 0) {
        errors[field] = 'Must be a non-negative integer.';
      } else {
        cleaned[field] = value;
      }

      continue;
    }

    if (field === 'priceMinor') {
      if (!Number.isInteger(value) || value < 0) {
        errors[field] = 'Must be a non-negative integer.';
      } else {
        cleaned[field] = value;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    invalidInput('Please correct the invalid event fields.', errors);
  }

  return cleaned;
}

function validateEventId(eventId) {
  if (typeof eventId !== 'string' || !UUID_REGEX.test(eventId)) {
    throw new HttpError(
      404,
      'EVENT_UNAVAILABLE',
      'Event not found or unavailable.'
    );
  }
}

async function findOwnedEvent(eventId, organizerId) {
  validateEventId(eventId);

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId,
    },
  });

  if (!event) {
    throw new HttpError(
      404,
      'EVENT_UNAVAILABLE',
      'Event not found or unavailable.'
    );
  }

  return event;
}

export async function createOrganizerEvent(organizerId, body) {
  validateBody(body);

  const data = validateEventFields(body);

  // Ownership comes from the authenticated user, never the request body.
  return prisma.event.create({
    data: {
      ...data,
      organizerId,
      status: 'DRAFT',
    },
  });
}

export async function updateOrganizerEvent(eventId, organizerId, body) {
  validateBody(body);

  const event = await findOwnedEvent(eventId, organizerId);

  const editableFields = Object.keys(body).filter((field) =>
    EVENT_FIELDS.includes(field)
  );

  if (editableFields.length === 0) {
    invalidInput('Provide at least one editable event field.');
  }

  const data = validateEventFields(body, { partial: true });

  return prisma.event.update({
    where: { id: event.id },
    data,
  });
}

export async function publishOrganizerEvent(eventId, organizerId) {
  const event = await findOwnedEvent(eventId, organizerId);

  if (event.status !== 'DRAFT') {
    throw new HttpError(
      409,
      'EVENT_NOT_PUBLISHABLE',
      'Only draft events can be published.'
    );
  }

  const errors = {};
  const now = new Date();

  if (event.startAt <= now) {
    errors.startAt = 'The event start date must be in the future.';
  }

  if (event.endAt <= event.startAt) {
    errors.endAt = 'The event end date must be after the start date.';
  }

  if (event.capacity <= 0) {
    errors.capacity = 'Capacity must be greater than zero.';
  }

  if (event.priceMinor < 0) {
    errors.priceMinor = 'Price must be zero or greater.';
  }

  if (Object.keys(errors).length > 0) {
    invalidInput(
      'Event cannot be published until its fields are corrected.',
      errors
    );
  }

  return prisma.event.update({
    where: { id: event.id },
    data: { status: 'PUBLISHED' },
  });
}

export async function checkInOrganizerTicket(eventId, organizerId, body) {
  validateEventId(eventId);
  validateBody(body);

  const ticketCode =
    typeof body.ticketCode === 'string' ? body.ticketCode.trim() : '';

  if (ticketCode === '' || ticketCode.length > 64) {
    invalidInput('Please provide a valid ticket code.', {
      ticketCode: 'Must be a non-empty string of at most 64 characters.',
    });
  }

  return prisma.$transaction(async (tx) => {
    const lockedEvents = await tx.$queryRaw`
      SELECT "id"
      FROM "Event"
      WHERE "id" = ${eventId}::uuid
      FOR UPDATE
    `;

    if (lockedEvents.length === 0) {
      throw new HttpError(
        404,
        'EVENT_UNAVAILABLE',
        'Event not found or unavailable.'
      );
    }

    const event = await tx.event.findFirst({
      where: { id: eventId, organizerId },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        hiddenAt: true,
      },
    });

    if (!event) {
      throw new HttpError(
        404,
        'EVENT_UNAVAILABLE',
        'Event not found or unavailable.'
      );
    }

    const lockedBookings = await tx.$queryRaw`
      SELECT "id"
      FROM "Booking"
      WHERE "ticketCode" = ${ticketCode}
        AND "eventId" = ${eventId}::uuid
      FOR UPDATE
    `;

    if (lockedBookings.length === 0) {
      throw new HttpError(
        404,
        'TICKET_NOT_FOUND',
        'Ticket not found for this event.'
      );
    }

    const booking = await tx.booking.findFirst({
      where: { ticketCode, eventId },
      select: { id: true, status: true, checkedInAt: true },
    });

    if (!booking) {
      throw new HttpError(
        404,
        'TICKET_NOT_FOUND',
        'Ticket not found for this event.'
      );
    }

    if (booking.status !== 'CONFIRMED') {
      throw new HttpError(
        409,
        'TICKET_NOT_CONFIRMED',
        'Only confirmed tickets can be checked in.'
      );
    }

    if (booking.checkedInAt) {
      return {
        checkedInAt: booking.checkedInAt,
        alreadyCheckedIn: true,
      };
    }

    if (event.status === 'CANCELLED') {
      throw new HttpError(
        409,
        'EVENT_UNAVAILABLE',
        'This event has been cancelled.'
      );
    }

    if (event.status !== 'PUBLISHED' || event.hiddenAt) {
      throw new HttpError(
        404,
        'EVENT_UNAVAILABLE',
        'Event not found or unavailable.'
      );
    }

    const now = new Date();
    const checkInOpensAt = new Date(event.startAt.getTime() - 60 * 60 * 1000);

    if (now < checkInOpensAt || now > event.endAt) {
      throw new HttpError(
        409,
        'CHECK_IN_CLOSED',
        'Check-in is available from one hour before the event until it ends.'
      );
    }

    const checkedInAt = now;
    await tx.booking.update({
      where: { id: booking.id },
      data: { checkedInAt },
    });

    return { checkedInAt, alreadyCheckedIn: false };
  });
}
