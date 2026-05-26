import AppHeader from "@/components/AppHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "admin",
  description: "管理画面です。",
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
