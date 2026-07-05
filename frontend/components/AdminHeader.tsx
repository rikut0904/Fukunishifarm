"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminMenuItems } from "@/lib/adminMenu";

const SESSION_STORAGE_KEY = "fukunishifarm.admin.session";

export default function AdminHeader() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setIsMobileMenuOpen(false);
    router.replace("/login");
  };

  return (
    <header className="admin-header">
      <div className="admin-header__inner">
        <div className="admin-header__top">
          <Link href="/admin" className="admin-header__brand" aria-label="管理ページのトップへ">
            <Image
              src="/img/logo_budou.png"
              alt="ふくにしファーム"
              width={220}
              height={74}
              priority
              className="h-auto w-20 sm:w-24 md:w-28"
            />
            <span className="admin-header__badge">Admin</span>
          </Link>

          <nav className="admin-header__nav" aria-label="管理メニュー">
            {adminMenuItems.map((item) => {
              const href = item.href.trim();
              const key = `${item.title}:${href || "disabled"}`;

              if (!href) {
                return (
                  <span key={key} aria-disabled="true" title="MICROCMS_SERVICE_DOMAIN を設定すると利用できます">
                    {item.title}
                  </span>
                );
              }

              return (
                <Link key={key} href={href}>
                  {item.title}
                </Link>
              );
            })}
            <Link href="/">TOPページ</Link>
            <button type="button" className="admin-header__signout" onClick={handleSignOut}>
              ログアウト
            </button>
          </nav>

          <button
            type="button"
            className="menu-button admin-header__menu-button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="管理メニューを開く"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className={`mobile-menu admin-header__mobile-menu transition-opacity duration-200 ${isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={(e) => {
          if (e.currentTarget === e.target) setIsMobileMenuOpen(false);
        }}
      >
        <aside
          className={`mobile-menu__panel admin-header__mobile-panel transform transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="mobile-menu__head">
            <h2 className="text-base font-semibold">管理メニュー</h2>
            <button
              type="button"
              className="menu-button border-[var(--border)] bg-white text-[var(--brand-strong)]"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="管理メニューを閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mobile-menu__links admin-header__mobile-links" aria-label="モバイル管理メニュー">
            {adminMenuItems.map((item) => {
              const href = item.href.trim();
              const key = `${item.title}:${href || "disabled"}`;

              if (!href) {
                return (
                  <span key={key} aria-disabled="true" title="MICROCMS_SERVICE_DOMAIN を設定すると利用できます">
                    <span>{item.title}</span>
                    <span aria-hidden="true">-</span>
                  </span>
                );
              }

              return (
                <Link key={key} href={href} onClick={() => setIsMobileMenuOpen(false)}>
                  <span>{item.title}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              );
            })}
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <span>TOPページ</span>
              <span aria-hidden="true">→</span>
            </Link>
            <button type="button" className="admin-header__mobile-signout" onClick={handleSignOut}>
              <span>ログアウト</span>
              <span aria-hidden="true">→</span>
            </button>
          </nav>
        </aside>
      </div>
    </header>
  );
}
