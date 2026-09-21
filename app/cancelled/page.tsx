import { redirect } from "next/navigation";

// Booked/Cancelled were merged into the unified Manage Bookings workspace.
export default function CancelledPage() {
  redirect("/bookings?status=cancelled");
}
