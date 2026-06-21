import AdminHeader from "@/components/AdminHeader";
import ContactMessageDetailRoute from "@/components/ContactMessageDetailRoute";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "お問い合わせ詳細の表示画面です。",
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminContactDetailPage({ params }: PageProps) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);

  return (
    <div className="site-shell">
      <AdminHeader />
      <main>
        <ContactMessageDetailRoute id={id} />
      </main>
      <SiteFooter />
    </div>
  );
}
