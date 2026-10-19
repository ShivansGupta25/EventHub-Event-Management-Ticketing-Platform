import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const authorization = req.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined;
  const token = req.cookies?.accessToken || bearerToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (!process.env.JWT_ACCESS_SECRET) {
    console.error('JWT_ACCESS_SECRET is not configured.');
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.id !== 'string'
  ) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  req.user = { id: payload.id, role: payload.role };
  return next();
}
