"use client";

import { BrandLogo } from "@/components/brand-logo";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

const items = [
  { href: "/profile", key: "profile" },
  { href: "/pending-payments", key: "pending_payments" },
  { href: "/reports/sales", key: "sales_report" },
  { href: "/booked", key: "booked" },
  { href: "/cancelled", key: "cancelled" },
  { href: "/reports", key: "report" },
  { href: "/help", key: "help" },
  { href: "/about", key: "about" },
];

export default function MenuPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-xl">
      <BrandLogo className="mx-auto mb-8 block" imgClassName="h-32" />
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between px-5 py-4 font-semibold text-gold hover:bg-azure"
          >
            <span>{t(item.key)}</span>
            <span>›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
