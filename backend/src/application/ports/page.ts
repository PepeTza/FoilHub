export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PageRequest {
  page: number;
  pageSize: number;
}
