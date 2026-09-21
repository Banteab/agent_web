"use client";

import { Button } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function ListLoadMore({
  hasMore,
  loading,
  onLoadMore,
  shown,
  total,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  shown: number;
  total: number;
}) {
  const { t } = useI18n();

  if (!total && !hasMore) return null;

  return (
    <div className="flex flex-col items-center gap-2 pt-4">
      {total > 0 ? (
        <p className="text-sm text-text-muted">
          {t("list_showing_count")
            .replace("{shown}", String(shown))
            .replace("{total}", String(total))}
        </p>
      ) : null}
      {hasMore ? (
        <Button variant="ghost" loading={loading} onClick={onLoadMore}>
          {t("load_more")}
        </Button>
      ) : shown > 0 && total > 0 && !hasMore ? (
        <p className="text-sm text-text-faint">{t("list_end")}</p>
      ) : null}
    </div>
  );
}
