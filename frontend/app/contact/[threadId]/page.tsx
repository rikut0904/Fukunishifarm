import AppHeader from "@/components/AppHeader";
import ContactThreadPanel from "@/components/ContactThreadPanel";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

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

  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ContactThreadPanel threadId={threadId} />
      </main>
      <SiteFooter />
    </div>
  );
}
