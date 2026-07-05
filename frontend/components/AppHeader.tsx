"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV_ITEMS } from "./navItems";

export default function AppHeader({ variant = "home" }: { variant?: "home" | "sub" }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__top">
          <Link href="/" className="brand" aria-label="ふくにしファームのトップへ">
            <Image
              src="/img/logo_budou.png"
              alt="ふくにしファーム"
              width={220}
              height={74}
              priority
              className="h-auto w-20 sm:w-24 md:w-28"
            />
          </Link>

          <nav className="site-nav" aria-label="メインメニュー">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="menu-button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="メニューを開く"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className={`mobile-menu transition-opacity duration-200 ${isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={(e) => {
          if (e.currentTarget === e.target) setIsMobileMenuOpen(false);
        }}
      >
        <aside className={`mobile-menu__panel transform transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="mobile-menu__head">
            <h2 className="text-base font-semibold">メニュー</h2>
            <button
              type="button"
              className="menu-button border-[var(--border)] bg-white text-[var(--brand-strong)]"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="メニューを閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mobile-menu__links" aria-label="モバイルメニュー">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>{item.label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </header>
  );
}
