import AdminHeader from "@/components/AdminHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import { buildAdminMenuItemsFromEnv } from "@/lib/adminMenu";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "admin",
  description: "管理画面です。",
};

export default function AdminPage() {
  const menuItems = buildAdminMenuItemsFromEnv();

  return (
    <div className="site-shell">
      <AdminHeader menuItems={menuItems} />
      <main>
        <AdminConsole menuItems={menuItems} />
      </main>
      <SiteFooter />
    </div>
  );
}
