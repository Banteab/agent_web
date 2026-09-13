import { redirect } from "next/navigation";

// The language picker was inlined into Settings directly.
export default function LanguagePage() {
  redirect("/settings");
}
