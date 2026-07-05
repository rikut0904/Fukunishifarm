import AppHeader from "@/components/AppHeader";
import ContactThreadPanel from "@/components/ContactThreadPanel";
import SiteFooter from "@/components/SiteFooter";
import { getDisplayErrorMessage } from "@/lib/api";
import { fetchPublicContactThreadServer, type PublicContactThread } from "@/lib/contact";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "お問い合わせスレッド",
  description: "ふくにしファームのお問い合わせスレッドです。",
};

type PageProps = {
  params: Promise<{
    threadId: string;
  }>;
};

export default async function ContactThreadPage({ params }: PageProps) {
  const { threadId } = await params;
  let initialDetail: PublicContactThread | null = null;
  let initialErrorMessage: string | null = null;

  try {
    initialDetail = await fetchPublicContactThreadServer(threadId);
  } catch (error) {
    initialErrorMessage = getDisplayErrorMessage(error, "スレッドを読み込めませんでした。");
  }

  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ContactThreadPanel threadId={threadId} initialDetail={initialDetail} initialErrorMessage={initialErrorMessage} />
      </main>
      <SiteFooter />
    </div>
  );
}
