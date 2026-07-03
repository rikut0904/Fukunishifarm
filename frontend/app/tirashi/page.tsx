import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ちらし",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function TirasiPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>ちらし</li>
        </ol>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Pamphlet</p>
            <h1 className="section__title">R8年度ちらし</h1>
          </div>
          <div className="page-stack">
            <p>
              予約を希望されるお客様は下記URLよりちらしを印刷し、FAXにてご予約ください。
              <br />ご予約は<Link href="/reservation">こちら</Link>からご覧ください
              <br />FAX：0748-82-1983
              <br />下記のちらしが見れない方は
              <a href="/PDF/R8_Pamphlet.pdf" target="_blank" rel="noreferrer">
                こちら
              </a>
              からご覧ください
            </p>
          </div>
        </section>

        <section className="section section--soft">
          <div className="media-frame">
            <iframe src="/PDF/R8_Pamphlet.pdf" width="100%" height="900px" style={{ border: 0 }} title="Pamphlet_PDF" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
