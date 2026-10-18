export class HttpError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, fields: err.fields },
    });
  }

  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(err.status).json({
      error: {
        code: 'INVALID_BODY',
        message: 'Invalid request body.',
        fields: {},
      },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Internal server error.', fields: {} },
  });
}
