import { redirect } from "next/navigation";

// The stats/recent-bookings/account-summary "Dashboard" this page used to
// show duplicated /profile and the booking lists — removed as part of the
// redesign away from a dashboard-style UI. See the redesign plan for where
// each piece of that content now lives.
export default function MenuPage() {
  redirect("/home");
}
