import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ご予約",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function ReservationPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>ご予約</li>
        </ol>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Reservation</p>
            <h1 className="section__title">ご予約</h1>
          </div>
          <p>ぶどう狩りのご予約は、下記のフォームからお申し込みください。</p>

          <div className="grid grid--2 mt-6">
            <article className="card card__body">
              <h2 className="card__title">個人のお客様(8名様以下)</h2>
              <p className="card__text">ご予約がなくてもぶどう狩りをおこなえますので、ぜひぜひお越しください！！</p>
            </article>
            <article className="card card__body">
              <h2 className="card__title">団体のお客様(9名様以上)</h2>
              <p className="card__text">団体のお客様は、下記のちらしを印刷してFAXにてご予約ください。</p>
              <p className="card__text">
                団体のご予約は<Link href="/download">こちら</Link>からダウンロードできます。
              </p>
            </article>
          </div>
        </section>

        <section className="section section--soft">
          <div className="section__head">
            <p className="eyebrow">Form</p>
            <h2 className="section__title">団体予約書式</h2>
          </div>
          <div className="media-frame">
            <iframe src="/latex/fukunishifarm_FAX.pdf" title="団体予約申込書" width="100%" height="800px" frameBorder={0}></iframe>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
