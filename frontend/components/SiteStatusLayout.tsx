import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

type SiteStatusLayoutProps = {
  eyebrow: string;
  title: string;
  message: string;
  actions?: React.ReactNode;
};

export default function SiteStatusLayout({ eyebrow, title, message, actions }: SiteStatusLayoutProps) {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <section className="section status-page">
          <div className="status-page__panel card">
            <div className="card__body status-page__body">
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="section__title">{title}</h1>
              <p className="status-page__message">{message}</p>
              <div className="status-page__actions">
                {actions ?? (
                  <Link href="/" className="button-link button-link--primary">
                    トップへ戻る
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
