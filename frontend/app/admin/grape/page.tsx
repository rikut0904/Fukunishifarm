import AdminHeader from "@/components/AdminHeader";
import AdminConsole from "@/components/AdminConsole";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "ぶどう情報の編集画面です。",
};

export default function AdminGrapePage() {
  return (
    <div className="site-shell">
      <AdminHeader />
      <main>
        <AdminConsole mode="grape" />
      </main>
      <SiteFooter />
    </div>
  );
}
