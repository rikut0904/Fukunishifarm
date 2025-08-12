import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ふくにしファーム-ご予約",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function ReservationPage() {
  return (
    <>
      <AppHeader variant="sub" />
      <main>
        <ol id="topic_path">
          <li><Link href="/">HOME</Link></li>
          <li>ご予約</li>
        </ol>
        <div id="reservation_content">
          <h1>ご予約</h1>
          <p>ぶどう狩りのご予約は、下記のフォームからお申し込みください。</p>
          <h2>個人のお客様(8名様以下)</h2>
          <p>ご予約がなくてもぶどう狩りをおこなえますので、ぜひぜひお越しください！！</p>
          <h2>団体のお客様(9名様以上)</h2>
          <p>団体のお客様は、下記のちらしを印刷してFAXにてご予約ください。</p>
          <p>
            団体のご予約は<Link href="/download">こちら</Link>からダウンロードできます。
          </p>
          <div className="pamphelet">
            <iframe src="/latex/fukunishifarm_FAX.pdf" width="100%" height="800px" frameBorder={0}></iframe>
          </div>
        </div>
      </main>
      <p className="page_top"><a href="#top">ページトップ</a></p>
      <SiteFooter />
    </>
  );
}
