export const AGENT_LIST_PAGE_SIZE = 20;

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
};

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

/** Supports paginated `{ data, total, … }` and legacy plain arrays. */
export function parsePaginated<T>(payload: unknown): PaginatedResult<T> {
  if (payload && typeof payload === "object" && "data" in payload) {
    const row = payload as Partial<PaginatedResult<T>> & { data?: unknown };
    const data = asArray<T>(row.data);
    const total = Number(row.total ?? data.length);
    const page = Number(row.page ?? 1);
    const limit = Number(row.limit ?? data.length) || AGENT_LIST_PAGE_SIZE;
    const totalPages = Number(row.totalPages ?? Math.max(1, Math.ceil(total / limit)));
    const hasMore =
      typeof row.hasMore === "boolean" ? row.hasMore : page < totalPages;
    return { data, total, page, limit, totalPages, hasMore };
  }

  const data = asArray<T>(payload);
  if (payload && typeof payload === "object") {
    const row = payload as { trips?: unknown };
    if (Array.isArray(row.trips)) {
      const trips = row.trips as T[];
      return {
        data: trips,
        total: trips.length,
        page: 1,
        limit: trips.length,
        totalPages: 1,
        hasMore: false,
      };
    }
  }

  return {
    data,
    total: data.length,
    page: 1,
    limit: data.length || AGENT_LIST_PAGE_SIZE,
    totalPages: 1,
    hasMore: false,
  };
}

export function withPageQuery(
  path: string,
  page: number,
  limit: number = AGENT_LIST_PAGE_SIZE,
): string {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return `${path}?${params.toString()}`;
}
