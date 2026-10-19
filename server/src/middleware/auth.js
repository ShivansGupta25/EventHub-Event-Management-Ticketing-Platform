import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { HttpError } from '../lib/errors.js';

export async function requireAuth(req, res, next) {
  let payload;
  try {
    payload = jwt.verify(
      req.cookies?.accessToken,
      process.env.JWT_ACCESS_SECRET
    );
  } catch {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Please log in.');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Please log in.');

  req.user = user;
  next();
}

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new HttpError(
        403,
        'FORBIDDEN',
        'You do not have access to this resource.'
      );
    }
    next();
  };
