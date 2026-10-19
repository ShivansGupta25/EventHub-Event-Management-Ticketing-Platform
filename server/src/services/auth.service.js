import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';

const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

async function createSession(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const familyId = crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      familyId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

export async function registerUser({ name, email, password } = {}) {
  const fields = {};

  if (typeof name !== 'string' || !name.trim()) {
    fields.name = 'Name is required.';
  } else if (name.trim().length > 100) {
    fields.name = 'Name must be at most 100 characters.';
  }

  if (typeof email !== 'string' || !email.trim()) {
    fields.email = 'Email is required.';
  }

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 72
  ) {
    fields.password = 'Password must be 8–72 characters.';
  }

  if (Object.keys(fields).length > 0) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'Invalid registration details.',
      fields
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'Email is already registered.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;

  try {
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new HttpError(409, 'EMAIL_TAKEN', 'Email is already registered.');
    }
    throw error;
  }

  return createSession(user);
}

export async function loginUser({ email, password } = {}) {
  const fields = {};

  if (typeof email !== 'string' || !email.trim()) {
    fields.email = 'Email is required.';
  }

  if (typeof password !== 'string' || !password) {
    fields.password = 'Password is required.';
  }

  if (Object.keys(fields).length > 0) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'Invalid login details.',
      fields
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password.'
    );
  }

  return createSession(user);
}

export async function refreshSession(token) {
  if (!token) {
    const error = new Error('Refresh token required');
    error.statusCode = 401;
    throw error;
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  const tokenHash = hashToken(token);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (
    !stored ||
    stored.userId !== payload.id ||
    stored.usedAt ||
    stored.revokedAt ||
    stored.expiresAt <= new Date()
  ) {
    const error = new Error('Refresh token is invalid');
    error.statusCode = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 401;
    throw error;
  }

  const session = await createSession(user);

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { usedAt: new Date() },
  });

  return session;
}
