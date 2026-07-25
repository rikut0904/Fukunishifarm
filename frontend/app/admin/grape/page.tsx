import AdminHeader from "@/components/AdminHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import { buildAdminMenuItemsFromEnv } from "@/lib/adminMenu";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "ぶどう情報の編集画面です。",
};

export default function AdminGrapePage() {
  const menuItems = buildAdminMenuItemsFromEnv();

  return (
    <div className="site-shell">
      <AdminHeader menuItems={menuItems} />
      <main>
        <AdminConsole mode="grape" />
      </main>
      <SiteFooter />
    </div>
  );
}
