import 'dotenv/config';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';

process.env.JWT_ACCESS_SECRET ||= 'booking-integration-test-secret';

test('booking endpoint rejects unauthenticated requests', async (t) => {
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

  const response = await fetch(`${baseUrl}/api/events/not-a-uuid/bookings`, {
    method: 'POST',
  });
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
  'free ticket bookings are authenticated, idempotent, and capacity-safe',
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
    let baseUrl;
    let attendee;
    let secondAttendee;
    const createdEventIds = [];

    await prisma.$connect();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    t.after(async () => {
      await prisma.event.deleteMany({
        where: { id: { in: createdEventIds } },
      });
      if (attendee || secondAttendee) {
        await prisma.user.deleteMany({
          where: {
            id: {
              in: [attendee?.id, secondAttendee?.id].filter(Boolean),
            },
          },
        });
      }
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
      await prisma.$disconnect();
    });

    const emailPrefix = `booking-test-${randomUUID()}`;
    [attendee, secondAttendee] = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Booking Test User',
          email: `${emailPrefix}-1@example.test`,
          passwordHash: 'not-used',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Booking Test User',
          email: `${emailPrefix}-2@example.test`,
          passwordHash: 'not-used',
        },
      }),
    ]);

    async function createEvent(overrides = {}) {
      const event = await prisma.event.create({
        data: {
          title: `Booking test ${randomUUID()}`,
          capacity: 5,
          ...overrides,
        },
      });
      createdEventIds.push(event.id);
      return event;
    }

    function tokenFor(userId) {
      return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '5m',
      });
    }

    async function book(eventId, userId, body = {}) {
      const token = userId ? tokenFor(userId) : undefined;
      return fetch(`${baseUrl}/api/events/${eventId}/bookings`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { cookie: `accessToken=${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
    }

    await t.test(
      'rejects an invalid event ID after authenticating an existing user',
      async () => {
        const response = await book('not-a-uuid', attendee.id);

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), {
          error: {
            code: 'EVENT_UNAVAILABLE',
            message: 'Event not found or unavailable.',
            fields: {},
          },
        });
      }
    );

    await t.test(
      'books an available event and returns the existing ticket on retry',
      async () => {
        const event = await createEvent();
        const first = await book(event.id, attendee.id, {
          userId: secondAttendee.id,
        });
        const firstBody = await first.json();
        const retry = await book(event.id, attendee.id);
        const retryBody = await retry.json();

        assert.equal(first.status, 201);
        assert.equal(firstBody.success, true);
        assert.equal(retry.status, 200);
        assert.equal(retryBody.ticket.id, firstBody.ticket.id);
        assert.equal(
          await prisma.ticket.count({ where: { eventId: event.id } }),
          1
        );
        assert.equal(
          (await prisma.event.findUnique({ where: { id: event.id } }))
            .bookedCount,
          1
        );
      }
    );

    await t.test(
      'does not duplicate tickets for concurrent requests by one user',
      async () => {
        const event = await createEvent();
        const responses = await Promise.all([
          book(event.id, attendee.id),
          book(event.id, attendee.id),
        ]);
        const bodies = await Promise.all(
          responses.map((response) => response.json())
        );

        assert.ok(
          responses.every(
            (response) => response.status === 200 || response.status === 201
          )
        );
        assert.equal(bodies[0].ticket.id, bodies[1].ticket.id);
        assert.equal(
          (await prisma.event.findUnique({ where: { id: event.id } }))
            .bookedCount,
          1
        );
      }
    );

    await t.test(
      'rejects full and closed events with conflict responses',
      async () => {
        const fullEvent = await createEvent({ capacity: 1, bookedCount: 1 });
        const closedEvent = await createEvent({ registrationOpen: false });

        const fullResponse = await book(fullEvent.id, attendee.id);
        const closedResponse = await book(closedEvent.id, attendee.id);

        assert.equal(fullResponse.status, 409);
        assert.match(
          (await fullResponse.json()).message,
          /no remaining seats/i
        );
        assert.equal(closedResponse.status, 409);
        assert.match(
          (await closedResponse.json()).message,
          /registration.*closed/i
        );
      }
    );

    await t.test('returns not found and unauthorized responses', async () => {
      const unknownEventId = randomUUID();
      const missingResponse = await book(unknownEventId, attendee.id);
      const unauthorizedResponse = await book(unknownEventId);

      assert.equal(missingResponse.status, 404);
      assert.equal(unauthorizedResponse.status, 401);
    });

    await t.test(
      'only one of two attendees can book the final seat',
      async () => {
        const event = await createEvent({ capacity: 1 });
        const responses = await Promise.all([
          book(event.id, attendee.id),
          book(event.id, secondAttendee.id),
        ]);

        assert.deepEqual(
          responses.map((response) => response.status).sort(),
          [201, 409]
        );
        assert.equal(
          (await prisma.event.findUnique({ where: { id: event.id } }))
            .bookedCount,
          1
        );
        assert.equal(
          await prisma.ticket.count({ where: { eventId: event.id } }),
          1
        );
      }
    );

    await t.test(
      'rolls back the booked-seat increment if ticket creation fails',
      async () => {
        const event = await createEvent();
        const nonexistentUserId = randomUUID();
        const response = await book(event.id, nonexistentUserId);

        assert.equal(response.status, 500);
        assert.equal(
          (await prisma.event.findUnique({ where: { id: event.id } }))
            .bookedCount,
          0
        );
        assert.equal(
          await prisma.ticket.count({ where: { eventId: event.id } }),
          0
        );
      }
    );
  }
);
