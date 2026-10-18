import {
  registerUser,
  loginUser,
  refreshSession,
} from '../services/auth.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

function sendSession(res, session, status = 200) {
  res.cookie('accessToken', session.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', session.refreshToken, {
    ...cookieOptions,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(status).json({
    success: true,
    user: session.user,
  });
}

function handleError(res, error) {
  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Email is already registered.',
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : 'Internal server error.',
  });
}

export async function register(req, res) {
  try {
    const session = await registerUser(req.body ?? {});
    return sendSession(res, session, 201);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function login(req, res) {
  try {
    const session = await loginUser(req.body ?? {});
    return sendSession(res, session);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function refresh(req, res) {
  try {
    const session = await refreshSession(req.cookies?.refreshToken);
    return sendSession(res, session);
  } catch (error) {
    if (error.statusCode === 401) {
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', {
        ...cookieOptions,
        path: '/api/auth',
      });
    }

    return handleError(res, error);
  }
}
