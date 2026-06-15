import AdminConsole from "@/components/AdminConsole";
import AdminHeader from "@/components/AdminHeader";
import SiteFooter from "@/components/SiteFooter";

export default function AdminNewsPage() {
  return (
    <div className="site-shell">
      <AdminHeader />
      <main>
        <AdminConsole mode="news" />
      </main>
      <SiteFooter />
    </div>
  );
}
