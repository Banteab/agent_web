import { redirect } from "next/navigation";

// Cross-agent search is now the "search all agents" toggle inside the
// unified Manage Bookings workspace.
export default function BookingSearchPage() {
  redirect("/bookings");
}
