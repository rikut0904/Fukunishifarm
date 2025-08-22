import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ふくにしファーム-ちらし",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function TirasiPage() {
  return (
    <>
      <AppHeader variant="sub" />
      <main>
        <ol id="topic_path">
          <li><Link href="/">HOME</Link></li>
          <li>ちらし</li>
        </ol>
        <div id="tirasi_content">
          <h1>R7年度ちらし</h1>
          <div className="text">
            <p>
              予約を希望されるお客様は下記URLよりちらしを印刷し、FAXにてご予約ください。
            </p>
            <p>
              ご予約は<Link href="/reservation">こちら</Link>からご覧ください
            </p>
            <p>FAX：0748-82-1983</p>
            <p>
              下記のちらしが見れない方は
              <a href="/PDF/R7_Pamphlet.pdf" target="_blank">こちら</a>
              からご覧ください
            </p>
          </div>
          <div className="pamphelet">
            <iframe src="/PDF/R7_Pamphlet.pdf" width="100%" style={{ border: 0 }} title="Pamphlet_PDF"></iframe>
          </div>
        </div>
      </main>
      <p className="page_top"><a href="#top">ページトップ</a></p>
      <SiteFooter />
    </>
  );
}
