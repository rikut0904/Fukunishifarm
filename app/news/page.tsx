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
          <p>ふくにしファームが販売しているぶどうの状況をお知らせします。</p>
          <p>※2025年8月24日より販売開始となります。ぜひぜひお越しください</p>
          {/* スライドデータ */}
          <div className="slider">
            <div className="slides">
              {/* 竜宝コメントアウト箇所 */}
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>竜宝</h4>
                  </div>
                  <img src="img/ryuhou.jpeg" alt="竜宝" className="slide-image" />
                </div>
              </div>
              {/* シナノスマイルコメントアウト箇所 */}
              {/*
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>シナノスマイル</h4>
                  </div>
                  <img src="img/shinano.jpeg" alt="シナノスマイル" className="slide-image" />
                </div>
              </div>
              */}
              {/* 藤稔コメントアウト箇所 */}
              {/*
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>藤稔</h4>
                  </div>
                  <img src="img/fujiminori.jpeg" alt="藤稔" className="slide-image" />
                </div>
              </div>
              */}
              {/* ピオーネコメントアウト箇所 */}
              {/*
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>ピオーネ</h4>
                  </div>
                  <img src="img/pione.jpeg" alt="ピオーネ" className="slide-image" />
                </div>
              </div>
              */}
              {/* シャインマスカットコメントアウト箇所 */}
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>シャインマスカット</h4>
                  </div>
                  <img src="img/syain.jpeg" alt="シャインマスカット" className="slide-image" />
                </div>
              </div>
              {/* 販売開始前文章コメントアウト箇所 */}
              {/* <div className="slide">
                <p style={{ fontSize: "21px" }}>
                  本年度もぶどうの時期が始まります！！<br />
                  本年度もおいしいぶどうが実っていますので、<br className="mobile_hid" />
                  ぜひふくにしファームへご来園ください。
                </p>
              </div> */}
              {/* 販売終了後文章コメントアウト箇所 */}

              {/* <div className="slide">
                <p style={{ fontSize: "21px" }}>
                  本年度のぶどうが終了いたしました。<br />
                  来年度もおいしいぶどうが実るよう育てていきますので、<br class="mobile_hid" />
                  ぜひ来年度ふくにしファームへご来園ください。
                </p>
              </div> */}
            </div>
          </div>
          <br />
          <h1>食べごろ</h1>
          {/* スライドデータ */}
          <div className="slider">
            <div className="slides">
              {/* 竜宝 */}
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>竜宝</h4>
                    <p>
                      現在食べごろです！！
                    </p>
                  </div>
                  <img src="img/ryuhou.jpeg" alt="竜宝" className="slide-image" />
                </div>
              </div>
              {/* シナノスマイル */}
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>シナノスマイル</h4>
                    <p>
                      しばらくお待ちください
                    </p>
                  </div>
                  <img src="img/shinano.jpeg" alt="シナノスマイル" className="slide-image" />
                </div>
              </div>
              {/* 藤稔 */}
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>藤稔</h4>
                    <p>
                      しばらくお待ちください
                    </p>
                  </div>
                  <img src="img/fujiminori.jpeg" alt="藤稔" className="slide-image" />
                </div>
              </div>
              {/* ピオーネ */}
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>ピオーネ</h4>
                    <p>
                      しばらくお待ちください
                    </p>
                  </div>
                  <img src="img/pione.jpeg" alt="ピオーネ" className="slide-image" />
                </div>
              </div>
              {/* シャインマスカット */}
              <div className="slide">
                <div className="slide-content">
                  <div className="slide-text">
                    <h4>シャインマスカット</h4>
                    <p>
                      現在食べごろです！！
                    </p>
                  </div>
                  <img src="img/syain.jpeg" alt="シャインマスカット" className="slide-image" />
                </div>
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
