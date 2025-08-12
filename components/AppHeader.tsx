"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"
import { NAV_ITEMS } from "./navItems"

export default function AppHeader({ variant = "home" }: { variant?: "home" | "sub" }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isSub = variant === "sub"

  return (
    <header className="header">
      <div
        className={
          // 背景画像は旧CSSの代替（Tailwindでサイズと配置を指定）
          `${isSub ? "h-[200px] md:h-[300px] lg:h-[340px]" : "h-[160px] md:h-[300px] lg:h-[360px]"} bg-[url('/img/header_footer.jpg')] bg-cover bg-center`
        }
      >
        <div className="header-content mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div id="logo">
            <Link href="/">
              <Image
                src="/img/logo_budou.png"
                alt="logo"
                width={400}
                height={120}
                priority
                className="h-auto w-24 sm:w-32 md:w-40 lg:w-48"
              />
            </Link>
          </div>
          {/* Desktop Navigation (lg+) */}
          <nav className="hidden lg:block font-english" aria-label="メインメニュー">
            <ul className="flex list-none gap-3 lg:gap-4 text-lg lg:text-2xl xl:text-[28px] 2xl:text-3xl">
              {NAV_ITEMS.map((item) => (
                <li key={item.href} className="whitespace-nowrap">
                  <Link href={item.href} className="text-green-700 hover:bg-orange-300/60 hover:text-purple-500 rounded-full px-1 py-1 transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile/Tablet Hamburger Icon (shown below lg) */}
          <div className="lg:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="メニューを開く"
            >
              <Menu className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10" strokeWidth={3} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu (Overlay + Slide Panel) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? "bg-black/45" : "pointer-events-none"}`}
        onClick={(e) => {
          if (e.currentTarget === e.target) setIsMobileMenuOpen(false)
        }}
      >
        <div
          className={`absolute right-0 top-0 h-full w-[85%] sm:w-[70%] md:w-1/2 bg-white transform ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out`}
        >
          <div className="flex justify-between items-center h-14 sm:h-16 px-4 sm:px-6 border-b">
            <h2 className="text-lg sm:text-xl font-semibold">メニュー</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => setIsMobileMenuOpen(false)} aria-label="メニューを閉じる">
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
          <nav className="flex flex-col p-4 space-y-3 sm:space-y-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base sm:text-lg font-medium text-gray-700 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
