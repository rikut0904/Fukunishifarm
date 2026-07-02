"use client";

import SiteStatusLayout from "@/components/SiteStatusLayout";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SiteStatusLayout
      eyebrow="Error"
      title="ページの表示に失敗しました"
      message={error.message || "時間をおいて再度お試しください。"}
      actions={
        <div className="status-page__actions">
          <button type="button" className="button-link button-link--primary" onClick={() => reset()}>
            もう一度試す
          </button>
        </div>
      }
    />
  );
}
