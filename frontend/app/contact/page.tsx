import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function ContactPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>contact</li>
        </ol>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Documents</p>
            <h1 className="section__title">各種書類</h1>
          </div>
          <p>
            欲しい資料がございましたら<Link href="/download">こちら</Link>からダウンロードできます。
          </p>
        </section>

        <section className="section section--soft">
          <div className="section__head">
            <p className="eyebrow">Contact</p>
            <h2 className="section__title">お問い合わせ</h2>
          </div>
          <p>
            ご不明点やサービスの改善案がございましたらこちらのアンケートフォームからお問い合わせください。
            <br />
            もし下記アンケートが閲覧されない等ございましたら
            <a
              target="_blank"
              href="https://docs.google.com/forms/d/e/1FAIpQLSf7wwAVAy-yqNc7G1bvPQ0-4nn5H8BXe25Y4cY5aGMpzNR4bg/viewform?embedded=true"
              rel="noreferrer"
            >
              こちら
            </a>
            からご連絡いただけますと幸いです。
          </p>
          <div className="media-frame">
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLSf7wwAVAy-yqNc7G1bvPQ0-4nn5H8BXe25Y4cY5aGMpzNR4bg/viewform?embedded=true"
              width="90%"
              height={600}
              frameBorder={0}
              marginHeight={0}
              marginWidth={0}
              className="center"
              style={{ margin: "0% 5%" }}
            >
              読み込んでいます…
            </iframe>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
