import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';

const bcryptRounds = (() => {
  const value = Number.parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10);
  return Number.isInteger(value) && value >= 4 && value <= 31 ? value : 10;
})();

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

async function createSession(user, familyId = crypto.randomUUID()) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      familyId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user: publicUser(user), accessToken, refreshToken };
}

function validateEmail(email, fields) {
  if (typeof email !== 'string' || !email.trim()) {
    fields.email = 'Email is required.';
    return;
  }

  const normalized = email.trim().toLowerCase();

  if (!normalized.includes('@')) {
    fields.email = 'Email must contain @.';
  } else if (normalized.length > 254) {
    fields.email = 'Email must be at most 254 characters.';
  }
}

export async function registerUser({ name, email, password } = {}) {
  const fields = {};

  if (typeof name !== 'string' || !name.trim()) {
    fields.name = 'Name is required.';
  } else if (name.trim().length > 100) {
    fields.name = 'Name must be at most 100 characters.';
  }

  validateEmail(email, fields);

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 72
  ) {
    fields.password = 'Password must be 8–72 characters.';
  }

  if (Object.keys(fields).length) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'Invalid registration details.',
      fields
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(password, bcryptRounds);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    return await createSession(user);
  } catch (error) {
    if (error instanceof HttpError) throw error;

    if (error?.code === 'P2002') {
      throw new HttpError(409, 'EMAIL_TAKEN', 'Email is already registered.');
    }

    throw error;
  }
}

export async function loginUser({ email, password } = {}) {
  const fields = {};
  validateEmail(email, fields);

  if (typeof password !== 'string' || !password) {
    fields.password = 'Password is required.';
  }

  if (Object.keys(fields).length) {
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
  try {
    if (!token) {
      throw new HttpError(
        401,
        'INVALID_REFRESH_TOKEN',
        'Refresh token is required.'
      );
    }

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    if (!payload.id || !payload.jti) {
      throw new HttpError(
        401,
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid.'
      );
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!stored || stored.userId !== payload.id) {
      throw new HttpError(
        401,
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid.'
      );
    }

    // A previously-used token indicates reuse: revoke the entire family.
    if (stored.usedAt) {
      await prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      throw new HttpError(
        401,
        'REFRESH_TOKEN_REUSED',
        'Refresh token reuse detected.'
      );
    }

    if (stored.revokedAt || stored.expiresAt <= new Date()) {
      throw new HttpError(
        401,
        'INVALID_REFRESH_TOKEN',
        'Refresh token is expired or revoked.'
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: stored.userId },
    });

    if (!user) {
      throw new HttpError(
        401,
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid.'
      );
    }

    const now = new Date();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Mark the old token used and create its replacement atomically.
    const rotated = await prisma.$transaction(async (tx) => {
      const result = await tx.refreshToken.updateMany({
        where: {
          id: stored.id,
          usedAt: null,
          revokedAt: null,
        },
        data: { usedAt: now },
      });

      if (result.count !== 1) return false;

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          familyId: stored.familyId,
          tokenHash: hashToken(refreshToken),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return true;
    });

    if (!rotated) {
      // Another request may have rotated this token concurrently.
      await prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      throw new HttpError(
        401,
        'REFRESH_TOKEN_REUSED',
        'Refresh token reuse detected.'
      );
    }

    return { user: publicUser(user), accessToken, refreshToken };
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) throw error;

    // Refresh failures consistently use the HttpError contract.
    throw new HttpError(
      401,
      'INVALID_REFRESH_TOKEN',
      'Refresh token is invalid or expired.'
    );
  }
}
