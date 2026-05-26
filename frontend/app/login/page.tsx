import AppHeader from "@/components/AppHeader";
import LoginConsole from "@/components/LoginConsole";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン",
  description: "管理画面へのログインページです。",
};

export default function LoginPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <LoginConsole />
      </main>
      <SiteFooter />
    </div>
  );
}
