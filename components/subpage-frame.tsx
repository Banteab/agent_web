"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { Protected } from "./protected";

export function SubpageFrame({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <div className="min-h-dvh bg-page">
        <header className="sticky top-0 z-20 bg-primary print:hidden">
          <div className="mx-auto flex h-20 max-w-3xl items-center justify-center px-4">
            <Link href="/home" aria-label="Biftu Bus">
              <BrandLogo onDark imgClassName="h-11" />
            </Link>
          </div>
        </header>
        {children}
      </div>
    </Protected>
  );
}
