import { redirect } from "next/navigation";

// Standalone Cancel search was folded into Booking Detail's "Request
// Cancellation" action, reached from Manage Bookings.
export default function CancelTabPage() {
  redirect("/bookings");
}
