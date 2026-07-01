import AppHeader from "@/components/AppHeader";
import LoginConsole from "@/components/LoginConsole";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン",
  description: "管理画面へのログインページです。",
};

type LoginPageProps = {
  searchParams?: Promise<{
    email?: string;
    invited?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const initialEmail = typeof params.email === "string" ? params.email : "";
  const invited = params.invited === "1";

  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <LoginConsole initialEmail={initialEmail} invited={invited} />
      </main>
      <SiteFooter />
    </div>
  );
}
