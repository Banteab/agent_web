"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AGENT_LIST_PAGE_SIZE,
  type PaginatedResult,
} from "./pagination";

type FetchPage<T> = (
  page: number,
  limit: number,
) => Promise<PaginatedResult<T>>;

export function usePaginatedApiList<T>(fetchPage: FetchPage<T>, pageSize = AGENT_LIST_PAGE_SIZE) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(1, pageSize);
      setItems(result.data);
      setTotal(result.total);
      setPage(1);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Request failed"));
      setItems([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, pageSize]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const result = await fetchPage(nextPage, pageSize);
      setItems((prev) => [...prev, ...result.data]);
      setTotal(result.total);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Request failed"));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore, page, pageSize]);

  return {
    items,
    total,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reload: loadFirst,
  };
}
