import SiteStatusLayout from "@/components/SiteStatusLayout";

export default function Loading() {
  return (
    <SiteStatusLayout
      eyebrow="Loading"
      title="ページを読み込んでいます"
      message="表示に必要なデータを取得しています。少しお待ちください。"
      actions={
        <div className="status-loading" aria-live="polite" aria-busy="true">
          <span className="status-loading__spinner" aria-hidden="true" />
          <span>読み込み中...</span>
        </div>
      }
    />
  );
}
