export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Pagination;
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
}
