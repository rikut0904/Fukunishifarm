import type { Metadata } from "next";

import SiteStatusLayout from "@/components/SiteStatusLayout";

export const metadata: Metadata = {
  title: "ページが見つかりません",
};

export default function NotFound() {
  return (
    <SiteStatusLayout
      eyebrow="404"
      title="ページが見つかりません"
      message="URLが変更されたか、ページが削除された可能性があります。"
    />
  );
}
