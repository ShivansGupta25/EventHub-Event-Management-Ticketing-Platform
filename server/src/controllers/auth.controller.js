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

  return res.status(status).json({ data: session.user });
}

function handleError(res, error) {
  const status =
    error.code === 'P2002' || error.statusCode === 409
      ? 409
      : [400, 401].includes(error.statusCode)
        ? error.statusCode
        : 500;

  return res.status(status).json({
    error: {
      message:
        status === 500
          ? 'Internal server error.'
          : status === 409
            ? 'Email is already registered.'
            : error.message,
    },
  });
}

export async function register(req, res) {
  try {
    return sendSession(res, await registerUser(req.body ?? {}), 201);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function login(req, res) {
  try {
    return sendSession(res, await loginUser(req.body ?? {}));
  } catch (error) {
    return handleError(res, error);
  }
}

export async function refresh(req, res) {
  try {
    return sendSession(res, await refreshSession(req.cookies?.refreshToken));
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
