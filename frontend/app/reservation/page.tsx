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
          <p>ご予約いただかなくてもご来園いただくことができます。</p>
        </section>

        <section className="section section--soft">
          <div className="section__head">
            <p className="eyebrow">Form</p>
            <h2 className="section__title">予約フォーム</h2>
          </div>
          <div className="media-frame">
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSdHZmzitOYEPHku_vfzkMAvjPmIbLQxZi2PHiNucryfq_ycwg/viewform" title="予約フォーム" width="100%" height="800px" frameBorder={0}></iframe>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
