import AdminHeader from "@/components/AdminHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "admin / contact",
  description: "お問い合わせ管理の表示画面です。",
};

export default function AdminContactPage() {
  return (
    <div className="site-shell">
      <AdminHeader />
      <main>
        <AdminConsole mode="contact" />
      </main>
      <SiteFooter />
    </div>
  );
}
