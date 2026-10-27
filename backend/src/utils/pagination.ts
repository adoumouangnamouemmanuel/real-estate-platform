import { BadRequestError } from "./errors.js";
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 12;

export function parsePagination(params: PaginationParams): {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
} {
  if (
    (params.page !== undefined &&
      (!Number.isInteger(params.page) || params.page < 1)) ||
    (params.pageSize !== undefined &&
      (!Number.isInteger(params.pageSize) || params.pageSize < 1))
  )
    throw new BadRequestError("Invalid pagination");
  const page = params.page ?? 1;
  const pageSize = Math.max(
    1,
    Math.min(100, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize, page, pageSize };
}

export function paginateResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
