import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { parsePagination } from '../lib/pagination.js';

const MAX_SEARCH_LENGTH = 100;

function parseDate(value, field) {
  if (value === undefined) return undefined;

  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, 'INVALID_QUERY', `Invalid ${field} date.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'INVALID_QUERY', `Invalid ${field} date.`);
  }

  return date;
}

function getPublicEventSelect() {
  return {
    id: true,
    title: true,
    description: true,
    category: true,
    coverKey: true,
    venue: true,
    address: true,
    city: true,
    timezone: true,
    startAt: true,
    endAt: true,
    registrationClosesAt: true,
    capacity: true,
    priceMinor: true,
    currency: true,
    status: true,
    createdAt: true,
    organizer: {
      select: {
        id: true,
        name: true,
      },
    },
  };
}

async function addAvailability(events, now = new Date()) {
  if (events.length === 0) return events;

  const eventIds = events.map((event) => event.id);

  const bookingCounts = await prisma.booking.groupBy({
    by: ['eventId'],
    where: {
      eventId: { in: eventIds },
      OR: [
        { status: 'CONFIRMED' },
        {
          status: 'PENDING_PAYMENT',
          holdExpiresAt: { gt: now },
        },
      ],
    },
    _count: {
      _all: true,
    },
  });

  const occupiedByEvent = new Map(
    bookingCounts.map((booking) => [booking.eventId, booking._count._all])
  );

  return events.map((event) => ({
    ...event,
    availability: Math.max(
      0,
      event.capacity - (occupiedByEvent.get(event.id) ?? 0)
    ),
  }));
}

export async function listPublicEvents(query) {
  const { q, category, city, pricing, from, to } = query;

  // Validate search text.
  if (q !== undefined) {
    if (typeof q !== 'string' || q.trim().length > MAX_SEARCH_LENGTH) {
      throw new HttpError(
        400,
        'INVALID_QUERY',
        `Search must be at most ${MAX_SEARCH_LENGTH} characters.`
      );
    }
  }

  // Validate category and city.
  for (const [field, value, maxLength] of [
    ['category', category, 50],
    ['city', city, 100],
  ]) {
    if (
      value !== undefined &&
      (typeof value !== 'string' ||
        value.trim().length === 0 ||
        value.trim().length > maxLength)
    ) {
      throw new HttpError(400, 'INVALID_QUERY', `Invalid ${field} parameter.`);
    }
  }

  // Validate pricing filter.
  if (pricing !== undefined && !['free', 'paid'].includes(pricing)) {
    throw new HttpError(
      400,
      'INVALID_QUERY',
      'Pricing must be either free or paid.'
    );
  }

  const { page, limit, skip } = parsePagination(query);

  const fromDate = parseDate(from, 'from');
  const toDate = parseDate(to, 'to');

  if (fromDate && toDate && fromDate > toDate) {
    throw new HttpError(
      400,
      'INVALID_QUERY',
      'The from date must be before or equal to the to date.'
    );
  }

  const now = new Date();

  // Events must be published, visible, and upcoming.
  const startAtFilter = {
    gte: fromDate && fromDate > now ? fromDate : now,
    ...(toDate ? { lte: toDate } : {}),
  };

  const where = {
    status: 'PUBLISHED',
    hiddenAt: null,
    startAt: startAtFilter,

    ...(q?.trim()
      ? {
          title: {
            contains: q.trim(),
            mode: 'insensitive',
          },
        }
      : {}),

    ...(category
      ? {
          category: {
            equals: category.trim(),
            mode: 'insensitive',
          },
        }
      : {}),

    ...(city
      ? {
          city: {
            equals: city.trim(),
            mode: 'insensitive',
          },
        }
      : {}),

    ...(pricing === 'free' ? { priceMinor: 0 } : {}),
    ...(pricing === 'paid' ? { priceMinor: { gt: 0 } } : {}),
  };

  const [total, events] = await prisma.$transaction([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      select: getPublicEventSelect(),
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      skip,
      take: limit,
    }),
  ]);

  return {
    data: await addAvailability(events, now),
    pagination: {
      page,
      limit,
      total,
    },
  };
}

export async function getPublicEvent(eventId) {
  // Event IDs are UUIDs. Return 404 for malformed IDs.
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (typeof eventId !== 'string' || !uuidRegex.test(eventId)) {
    throw new HttpError(
      404,
      'EVENT_UNAVAILABLE',
      'Event not found or unavailable.'
    );
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      hiddenAt: null,
      status: {
        in: ['PUBLISHED', 'CANCELLED'],
      },
    },
    select: getPublicEventSelect(),
  });

  if (!event) {
    throw new HttpError(
      404,
      'EVENT_UNAVAILABLE',
      'Event not found or unavailable.'
    );
  }

  const [eventWithAvailability] = await addAvailability([event]);

  return eventWithAvailability;
}
