export interface PaginationResult {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/** Coerce raw page params into safe values and compute the SQL skip/take. */
export function getPagination(
  page?: number | null,
  pageSize?: number | null,
  maxPageSize = 100,
): PaginationResult {
  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safeSize = Math.min(maxPageSize, Math.max(1, Math.floor(pageSize ?? 20)));
  return { page: safePage, pageSize: safeSize, skip: (safePage - 1) * safeSize, take: safeSize };
}
