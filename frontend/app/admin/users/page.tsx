import AdminHeader from "@/components/AdminHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import { buildAdminMenuItemsFromEnv } from "@/lib/adminMenu";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "ユーザー管理の準備画面です。",
};

export default function AdminUsersPage() {
  const menuItems = buildAdminMenuItemsFromEnv();

  return (
    <div className="site-shell">
      <AdminHeader menuItems={menuItems} />
      <main>
        <AdminConsole mode="users" />
      </main>
      <SiteFooter />
    </div>
  );
}
