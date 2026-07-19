import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ご予約",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function ReservationPage() {
  const reservationFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdHZmzitOYEPHku_vfzkMAvjPmIbLQxZi2PHiNucryfq_ycwg/viewform";

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
          <div className="reservation-hero">
            <div className="reservation-hero__copy">
              <div className="section__head">
                <p className="eyebrow">Reservation</p>
                <h1 className="section__title">ご予約</h1>
                <p className="section__lead">ご予約いただかなくてもご来園いただけます。</p>
                <p className="section__lead">9名様以上の団体予約は、事前のお申し込みをお願いいたします。</p>
              </div>
            </div>
            <div className="reservation-hero__media">
              <Image src="/img/farm_inside.jpeg" alt="ふくにしファームの園内" width={1200} height={900} priority className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="reservation-options">
            <article className="card reservation-card">
              <div>
                <h2 className="card__title">Web予約フォーム</h2>
                <p className="card__text">ぶどう狩りのご予約は、下記のフォームからお申し込みください。</p>
              </div>
              <Link className="button-link button-link--primary reservation-card__button" target="_blank" rel="noreferrer" href={reservationFormUrl}>
                予約フォームを開く
              </Link>
            </article>
            <article className="card reservation-card">
              <div>
                <h2 className="card__title">団体予約書式</h2>
                <p className="card__text">9名様以上のお客様は、フォームまたは下記の団体予約申込書を印刷し、FAXにてお申し込みください。</p>
              </div>
              <Link className="button-link button-link--secondary reservation-card__button" href="/latex/fukunishifarm_FAX.pdf" target="_blank">
                申込書PDFを開く
              </Link>
            </article>
          </div>
        </section>

        <section className="section section--soft">
          <div className="section__head">
            <p className="eyebrow">Form</p>
            <h2 className="section__title">団体予約書式</h2>
          </div>
          <p className="section__lead">表示されない場合は<Link href="/download">ダウンロード資料</Link>から「団体予約申込書」を開いてください。</p>
          <div className="media-frame reservation-pdf">
            <iframe src="/latex/fukunishifarm_FAX.pdf" title="団体予約申込書" width="100%" height="800px" frameBorder={0}></iframe>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
