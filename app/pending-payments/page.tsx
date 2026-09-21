import { redirect } from "next/navigation";

// Pending Payments was renamed to Payments as part of the sidebar redesign.
export default function PendingPaymentsPage() {
  redirect("/payments");
}
