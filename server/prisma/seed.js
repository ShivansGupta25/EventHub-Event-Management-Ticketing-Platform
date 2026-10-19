// Demo-only data. Safe to re-run: everything is upserted by fixed IDs/emails.
// Demo password for all three accounts: demo1234 (never use outside local/demo).
import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../src/db.js';

const DAY = 24 * 60 * 60 * 1000;
const at = (days, hours = 0) =>
  new Date(Date.now() + days * DAY + hours * 3600 * 1000);

const passwordHash = await bcrypt.hash('demo1234', 10);
const user = (email, name, role) =>
  prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, name, role, passwordHash },
  });

const attendee = await user('attendee@demo.test', 'Demo Attendee', 'ATTENDEE');
const organizer = await user(
  'organizer@demo.test',
  'Demo Organizer',
  'ORGANIZER'
);
await user('admin@demo.test', 'Demo Admin', 'ADMIN');

const base = {
  organizerId: organizer.id,
  description: 'Demo event seeded for local development.',
  venue: 'Rishihood Auditorium',
  address: 'Sonipat, Haryana',
  city: 'Sonipat',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  status: 'PUBLISHED',
};

const events = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Free Tech Meetup',
    category: 'Tech',
    startAt: at(7),
    capacity: 100,
    priceMinor: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Paid Design Workshop',
    category: 'Workshop',
    startAt: at(10),
    capacity: 30,
    priceMinor: 49900,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    title: 'Sold Out Music Night',
    category: 'Music',
    startAt: at(5),
    capacity: 1,
    priceMinor: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    title: 'Registration Closed Talk',
    category: 'Talk',
    startAt: at(0, 2),
    capacity: 50,
    priceMinor: 0,
    registrationClosesAt: at(0, -1),
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    title: 'Draft Hackathon',
    category: 'Tech',
    startAt: at(20),
    capacity: 200,
    priceMinor: 0,
    status: 'DRAFT',
  },
];

for (const e of events) {
  const data = {
    ...base,
    ...e,
    endAt: new Date(e.startAt.getTime() + 3 * 3600 * 1000),
    registrationClosesAt: e.registrationClosesAt ?? e.startAt,
  };
  await prisma.event.upsert({
    where: { id: e.id },
    update: data,
    create: data,
  });
}

// Fill the sold-out event's only seat.
const soldOut = events[2];
const active = await prisma.booking.findFirst({
  where: {
    eventId: soldOut.id,
    status: { in: ['PENDING_PAYMENT', 'CONFIRMED'] },
  },
});
if (!active) {
  await prisma.booking.create({
    data: {
      userId: attendee.id,
      eventId: soldOut.id,
      status: 'CONFIRMED',
      amountMinor: 0,
      currency: 'INR',
      eventSnapshot: {
        title: soldOut.title,
        startAt: soldOut.startAt,
        priceMinor: 0,
        currency: 'INR',
      },
      ticketCode: crypto.randomBytes(16).toString('base64url'),
    },
  });
}

console.log(
  'Seeded demo users (password: demo1234) and',
  events.length,
  'events.'
);
await prisma.$disconnect();
