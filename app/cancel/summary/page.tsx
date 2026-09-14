"use client";

import { Spinner } from "@/components/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

// Cancel Summary was folded into Booking Detail's "Request Cancellation"
// action — redirect straight there when we know the ticket number.
function CancelSummaryRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const ticket = params.get("ticket");

  useEffect(() => {
    router.replace(ticket ? `/bookings/ticket/${encodeURIComponent(ticket)}` : "/bookings");
  }, [router, ticket]);

  return <Spinner />;
}

export default function CancelSummaryPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CancelSummaryRedirect />
    </Suspense>
  );
}
