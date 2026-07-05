import AdminHeader from "@/components/AdminHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import { buildAdminMenuItems } from "@/lib/adminMenu";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "admin",
  description: "管理画面です。",
};

export default function AdminPage() {
  const menuItems = buildAdminMenuItems(
    process.env.MICROCMS_SERVICE_DOMAIN?.trim() || "",
    process.env.MICROCMS_BLOG_ENDPOINT?.trim() || "blogs",
    process.env.MICROCMS_NEWS_ENDPOINT?.trim() || "news",
  );

  return (
    <div className="site-shell">
      <AdminHeader />
      <main>
        <AdminConsole menuItems={menuItems} />
      </main>
      <SiteFooter />
    </div>
  );
}
