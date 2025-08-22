import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ふくにしファーム-お問い合わせ",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function ContactPage() {
  return (
    <>
      <AppHeader variant="sub" />
      <main>
        <h1>各種書類</h1>
        <p>
          欲しい資料がございましたら<Link href="/download">こちら</Link>からダウンロードできます。
        </p>
        <h1>お問い合わせ</h1>
        <p>
          ご不明点やサービスの改善案がございましたらこちらのアンケートフォームからお問い合わせください。
          <br />
          もし下記アンケートが閲覧されない等ございましたら
          <a
            target="_blank"
            href="https://docs.google.com/forms/d/e/1FAIpQLSf7wwAVAy-yqNc7G1bvPQ0-4nn5H8BXe25Y4cY5aGMpzNR4bg/viewform?embedded=true"
          >
            こちら
          </a>
          からご連絡いただけますと幸いです。
        </p>
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
      </main>
      <p className="page_top"><a href="#top">ページトップ</a></p>
      <SiteFooter />
    </>
  );
}
