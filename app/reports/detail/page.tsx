"use client";

import { Spinner } from "@/components/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

// Reports and Reports Detail were merged into a single /reports screen.
function ReportDetailRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const type = params.get("type");

  useEffect(() => {
    router.replace(type ? `/reports?type=${encodeURIComponent(type)}` : "/reports");
  }, [router, type]);

  return <Spinner />;
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ReportDetailRedirect />
    </Suspense>
  );
}
