import AdminHeader from "@/components/AdminHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "ユーザー管理の準備画面です。",
};

export default function AdminUsersPage() {
  return (
    <div className="site-shell">
      <AdminHeader />
      <main>
        <AdminConsole mode="users" />
      </main>
      <SiteFooter />
    </div>
  );
}
