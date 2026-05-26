import AppHeader from "@/components/AppHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "管理者ポータル",
  description: "管理者向けのログインとユーザー作成ページです。",
};

export default function AdminPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <AdminConsole />
      </main>
      <SiteFooter />
    </div>
  );
}
