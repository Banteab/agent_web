import { redirect } from "next/navigation";

// Checker was renamed/moved to Find Ticket.
export default function CheckerPage() {
  redirect("/find-ticket");
}
