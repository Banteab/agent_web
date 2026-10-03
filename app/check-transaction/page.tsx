import { redirect } from "next/navigation";

export default function CheckTransactionRedirectPage() {
  redirect("/transactions");
}
