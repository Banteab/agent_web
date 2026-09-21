import { redirect } from "next/navigation";

// Booked/Cancelled were merged into the unified Manage Bookings workspace.
export default function BookedPage() {
  redirect("/bookings?status=booked");
}
