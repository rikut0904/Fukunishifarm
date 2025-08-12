import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ふくにしファーム",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/img/icon_budou.png" />

        {/* Reset CSS */}
        <link rel="stylesheet" href="https://unpkg.com/ress/dist/ress.min.css" />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Philosopher&display=swap"
          rel="stylesheet"
        />

        {/* Original CSS (from old site, served from public) */}
        <link rel="stylesheet" href="/css/header_footer_pc.css" />
        <link rel="stylesheet" href="/css/header_footer_mobile.css" />
        <link rel="stylesheet" href="/css/style.css" />
        <link rel="stylesheet" href="/css/widget_pc.css" />
        <link rel="stylesheet" href="/css/widget_tablet.css" />
        <link rel="stylesheet" href="/css/widget_phone.css" />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
