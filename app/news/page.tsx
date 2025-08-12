import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ふくにしファーム-news",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function NewsPage() {
  return (
    <>
      <AppHeader variant="sub" />
      <main>
        <ol id="topic_path">
          <li><Link href="/">HOME</Link></li>
          <li>news</li>
        </ol>
        <div className="news_content">
          <h1>販売状況</h1>
          <div className="slider">
            <div className="slides">
              <div className="slide">
                <p style={{ fontSize: 21 }}>
                  本年度もぶどうの時期が始まります！！<br />
                  本年度もおいしいぶどうが実っていますので、
                  <br className="mobile_hid" />
                  ぜひふくにしファームへご来園ください。
                </p>
              </div>
            </div>
          </div>
          <h1>お知らせ</h1>
          <ul className="news-info inside">
            <li>
              料金を変更させていただきました。詳しくは
              <a href="/price">こちら</a>をご覧ください。
            </li>
            <li>ホームページをリニューアルしました。</li>
          </ul>
        </div>
      </main>
      <p className="page_top"><a href="#top">ページトップ</a></p>
      <SiteFooter />
    </>
  );
}
