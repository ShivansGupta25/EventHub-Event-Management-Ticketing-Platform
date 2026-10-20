import 'dotenv/config';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';

process.env.JWT_ACCESS_SECRET ||= 'organizer-integration-test-secret';

test('organizer check-in rejects unauthenticated requests', async (t) => {
  const { default: app } = await import('../src/app.js');
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(
    () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      )
  );

  const response = await fetch(
    `${baseUrl}/api/organizer/events/${randomUUID()}/check-ins`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ticketCode: 'ticket-code' }),
    }
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'UNAUTHENTICATED',
      message: 'Please log in.',
      fields: {},
    },
  });
});

test(
  'organizer event check-in validates tickets and is concurrency-safe',
  {
    skip:
      !process.env.DATABASE_URL &&
      'DATABASE_URL is required for integration tests.',
  },
  async (t) => {
    const [{ default: app }, { prisma }] = await Promise.all([
      import('../src/app.js'),
      import('../src/db.js'),
    ]);
    const server = createServer(app);
    const createdEventIds = [];
    const createdBookingIds = [];
    const createdUserIds = [];

    t.after(async () => {
      await prisma.booking.deleteMany({
        where: { id: { in: createdBookingIds } },
      });
      await prisma.event.deleteMany({
        where: { id: { in: createdEventIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
      if (server.listening) {
        await new Promise((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve()))
        );
      }
      await prisma.$disconnect();
    });

    await prisma.$connect();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const organizer = await prisma.user.create({
      data: {
        name: 'Check-in Organizer',
        email: `check-in-organizer-${randomUUID()}@example.test`,
        passwordHash: 'not-used',
        role: 'ORGANIZER',
      },
    });
    const otherOrganizer = await prisma.user.create({
      data: {
        name: 'Other Check-in Organizer',
        email: `other-check-in-organizer-${randomUUID()}@example.test`,
        passwordHash: 'not-used',
        role: 'ORGANIZER',
      },
    });
    const attendee = await prisma.user.create({
      data: {
        name: 'Check-in Attendee',
        email: `check-in-attendee-${randomUUID()}@example.test`,
        passwordHash: 'not-used',
      },
    });
    createdUserIds.push(organizer.id, otherOrganizer.id, attendee.id);

    async function createEvent(ownerId = organizer.id, overrides = {}) {
      const event = await prisma.event.create({
        data: {
          organizerId: ownerId,
          title: `Check-in test ${randomUUID()}`,
          description: 'Organizer check-in integration test.',
          category: 'Test',
          venue: 'Test venue',
          address: '1 Test Street',
          city: 'Test City',
          timezone: 'UTC',
          startAt: new Date(Date.now() - 10 * 60 * 1000),
          endAt: new Date(Date.now() + 60 * 60 * 1000),
          registrationClosesAt: new Date(Date.now() - 15 * 60 * 1000),
          capacity: 5,
          priceMinor: 0,
          currency: 'USD',
          status: 'PUBLISHED',
          ...overrides,
        },
      });
      createdEventIds.push(event.id);
      return event;
    }

    async function createBooking(eventId, ticketCode, status = 'CONFIRMED') {
      const booking = await prisma.booking.create({
        data: {
          userId: attendee.id,
          eventId,
          status,
          amountMinor: 0,
          currency: 'USD',
          eventSnapshot: { title: 'Check-in test' },
          ticketCode,
        },
      });
      createdBookingIds.push(booking.id);
      return booking;
    }

    function tokenFor(userId = organizer.id) {
      return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '5m',
      });
    }

    function checkIn(eventId, ticketCode, userId = organizer.id) {
      return fetch(`${baseUrl}/api/organizer/events/${eventId}/check-ins`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: `accessToken=${tokenFor(userId)}`,
        },
        body: JSON.stringify({ ticketCode }),
      });
    }

    await t.test(
      'does not reveal a ticket belonging to another event',
      async () => {
        const event = await createEvent();
        const otherEvent = await createEvent();
        const booking = await createBooking(otherEvent.id, randomUUID());

        const response = await checkIn(event.id, booking.ticketCode);
        const body = await response.json();

        assert.equal(response.status, 404);
        assert.equal(body.error.code, 'TICKET_NOT_FOUND');
        assert.equal(body.error.message, 'Ticket not found for this event.');
        assert.equal(body.data, undefined);
      }
    );

    await t.test(
      'rejects a ticket from an event the organizer does not own',
      async () => {
        const event = await createEvent(otherOrganizer.id);
        const booking = await createBooking(event.id, randomUUID());

        const response = await checkIn(event.id, booking.ticketCode);
        const body = await response.json();

        assert.equal(response.status, 404);
        assert.equal(body.error.code, 'EVENT_UNAVAILABLE');
        assert.equal(body.data, undefined);
      }
    );

    await t.test('rejects non-organizer access', async () => {
      const event = await createEvent();
      const response = await checkIn(event.id, randomUUID(), attendee.id);
      const body = await response.json();

      assert.equal(response.status, 403);
      assert.deepEqual(body, {
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this resource.',
          fields: {},
        },
      });
    });

    await t.test('rejects missing and invalid ticket codes', async () => {
      const event = await createEvent();

      for (const ticketCode of [undefined, '', '   ', null, 42, {}]) {
        const response = await fetch(
          `${baseUrl}/api/organizer/events/${event.id}/check-ins`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              cookie: `accessToken=${tokenFor()}`,
            },
            body: JSON.stringify(
              ticketCode === undefined ? {} : { ticketCode }
            ),
          }
        );
        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.error.code, 'VALIDATION_ERROR');
        assert.equal(typeof body.error.fields.ticketCode, 'string');
      }
    });

    await t.test(
      'rejects cancelled bookings that retain a ticket code',
      async () => {
        const event = await createEvent();
        const booking = await createBooking(
          event.id,
          randomUUID(),
          'CANCELLED'
        );

        assert.equal(booking.ticketCode !== null, true);
        const response = await checkIn(event.id, booking.ticketCode);

        assert.equal(response.status, 409);
        assert.equal(
          (await response.json()).error.code,
          'TICKET_NOT_CONFIRMED'
        );
      }
    );

    await t.test(
      'rejects a first scan before the check-in window opens',
      async () => {
        const event = await createEvent(undefined, {
          startAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          endAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
        });
        const booking = await createBooking(event.id, randomUUID());

        const response = await checkIn(event.id, booking.ticketCode);

        assert.equal(response.status, 409);
        assert.equal((await response.json()).error.code, 'CHECK_IN_CLOSED');
      }
    );

    await t.test('rejects a first scan after the event ends', async () => {
      const event = await createEvent(undefined, {
        startAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        endAt: new Date(Date.now() - 60 * 60 * 1000),
      });
      const booking = await createBooking(event.id, randomUUID());

      const response = await checkIn(event.id, booking.ticketCode);

      assert.equal(response.status, 409);
      assert.equal((await response.json()).error.code, 'CHECK_IN_CLOSED');
    });

    await t.test('rejects a first scan for a cancelled event', async () => {
      const event = await createEvent(undefined, { status: 'CANCELLED' });
      const booking = await createBooking(event.id, randomUUID());

      const response = await checkIn(event.id, booking.ticketCode);
      const body = await response.json();

      assert.equal(response.status, 409);
      assert.equal(body.error.code, 'EVENT_UNAVAILABLE');
      assert.equal(body.error.message, 'This event has been cancelled.');
    });

    await t.test('rejects a first scan for a hidden event', async () => {
      const event = await createEvent(undefined, {
        hiddenAt: new Date(),
      });
      const booking = await createBooking(event.id, randomUUID());

      const response = await checkIn(event.id, booking.ticketCode);
      const body = await response.json();

      assert.equal(response.status, 404);
      assert.equal(body.error.code, 'EVENT_UNAVAILABLE');
      assert.equal(body.error.message, 'Event not found or unavailable.');
    });

    await t.test('rejects unknown ticket codes', async () => {
      const event = await createEvent();
      const response = await checkIn(event.id, randomUUID());

      assert.equal(response.status, 404);
      assert.equal((await response.json()).error.code, 'TICKET_NOT_FOUND');
    });

    await t.test(
      'preserves the original timestamp on a repeat scan after check-in closes',
      async () => {
        const event = await createEvent();
        const booking = await createBooking(event.id, randomUUID());
        const firstResponse = await checkIn(event.id, booking.ticketCode);
        const firstBody = await firstResponse.json();

        assert.equal(firstResponse.status, 200);
        assert.equal(firstBody.data.alreadyCheckedIn, false);
        await prisma.event.update({
          where: { id: event.id },
          data: { endAt: new Date(Date.now() - 60 * 1000) },
        });

        const repeatResponse = await checkIn(event.id, booking.ticketCode);
        const repeatBody = await repeatResponse.json();

        assert.equal(repeatResponse.status, 200);
        assert.equal(repeatBody.data.alreadyCheckedIn, true);
        assert.equal(repeatBody.data.checkedInAt, firstBody.data.checkedInAt);
        assert.equal(
          (
            await prisma.booking.findUnique({ where: { id: booking.id } })
          ).checkedInAt.toISOString(),
          firstBody.data.checkedInAt
        );
      }
    );

    await t.test(
      'records exactly one check-in for simultaneous scans',
      async () => {
        const event = await createEvent();
        const booking = await createBooking(event.id, randomUUID());
        const responses = await Promise.all([
          checkIn(event.id, booking.ticketCode),
          checkIn(event.id, booking.ticketCode),
        ]);
        const bodies = await Promise.all(
          responses.map((response) => response.json())
        );

        assert.deepEqual(
          responses.map((response) => response.status),
          [200, 200]
        );
        assert.deepEqual(
          bodies.map((body) => body.data.alreadyCheckedIn).sort(),
          [false, true]
        );
        assert.equal(bodies[0].data.checkedInAt, bodies[1].data.checkedInAt);
        assert.equal(
          (
            await prisma.booking.findUnique({ where: { id: booking.id } })
          ).checkedInAt.toISOString(),
          bodies[0].data.checkedInAt
        );
      }
    );
  }
);
