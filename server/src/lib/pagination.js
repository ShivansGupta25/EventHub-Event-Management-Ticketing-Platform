import { HttpError } from './errors.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_PAGE = 100000;

function parsePositiveInteger(value, field, defaultValue, maxValue) {
  if (value === undefined) return defaultValue;

  if (
    typeof value !== 'string' ||
    !/^\d+$/.test(value) ||
    Number(value) < 1 ||
    Number(value) > maxValue
  ) {
    throw new HttpError(
      400,
      'INVALID_QUERY',
      `The ${field} parameter must be between 1 and ${maxValue}.`
    );
  }

  return Number(value);
}

export function parsePagination(query) {
  const page = parsePositiveInteger(query.page, 'page', 1, MAX_PAGE);
  const limit = parsePositiveInteger(
    query.limit,
    'limit',
    DEFAULT_LIMIT,
    MAX_LIMIT
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
