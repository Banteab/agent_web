import { redirect } from "next/navigation";

// The sessionStorage-handoff detail view is gone — Booking Detail is now a
// real, deep-linkable route (/bookings/ticket/[ticketNo]) reached from
// Manage Bookings, so there's no ticket context to recover here.
export default function CancelledDetailPage() {
  redirect("/bookings?status=cancelled");
}
