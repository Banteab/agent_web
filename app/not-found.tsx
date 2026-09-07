import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-page px-6 text-center">
      <BrandLogo imgClassName="h-20" />
      <h1 className="text-2xl font-bold text-navy">Page not found</h1>
      <Link href="/home" className="font-semibold text-primary">
        Back to home
      </Link>
    </div>
  );
}
