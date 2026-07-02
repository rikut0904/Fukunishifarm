"use client";

import "./globals.css";

import SiteStatusLayout from "@/components/SiteStatusLayout";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <SiteStatusLayout
          eyebrow="System Error"
          title="システムエラーが発生しました"
          message={error.message || "時間をおいて再度お試しください。"}
          actions={
            <div className="status-page__actions">
              <button type="button" className="button-link button-link--primary" onClick={() => reset()}>
                再読み込みする
              </button>
            </div>
          }
        />
      </body>
    </html>
  );
}
