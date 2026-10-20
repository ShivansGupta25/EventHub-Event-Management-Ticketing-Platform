import crypto from 'node:crypto';
import {
  registerUser,
  loginUser,
  refreshSession,
} from '../services/auth.service.js';
import { prisma } from '../db.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

const refreshCookieOptions = {
  ...cookieOptions,
  path: '/api/auth',
};

function sendSession(res, session, status = 200) {
  res.cookie('accessToken', session.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', session.refreshToken, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(status).json({ data: session.user });
}

function clearSessionCookies(res) {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', refreshCookieOptions);
}

export async function register(req, res) {
  return sendSession(res, await registerUser(req.body ?? {}), 201);
}

export async function login(req, res) {
  return sendSession(res, await loginUser(req.body ?? {}));
}

export async function refresh(req, res) {
  try {
    return sendSession(res, await refreshSession(req.cookies?.refreshToken));
  } catch (error) {
    if (error.status === 401 || error.statusCode === 401) {
      clearSessionCookies(res);
    }
    throw error;
  }
}

export function me(req, res) {
  return res.status(200).json({ data: req.user });
}

export async function logout(req, res) {
  const token = req.cookies?.refreshToken;

  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { familyId: true },
    });

    if (stored) {
      await prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  clearSessionCookies(res);
  return res.status(204).end();
}
