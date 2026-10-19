export function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
