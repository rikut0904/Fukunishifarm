import AdminHeader from "@/components/AdminHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import { buildAdminMenuItemsFromEnv } from "@/lib/adminMenu";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "お問い合わせ管理の表示画面です。",
};

export default function AdminContactPage() {
  const menuItems = buildAdminMenuItemsFromEnv();

  return (
    <div className="site-shell">
      <AdminHeader menuItems={menuItems} />
      <main>
        <AdminConsole mode="contact" />
      </main>
      <SiteFooter />
    </div>
  );
}
