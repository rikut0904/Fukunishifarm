import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ふくにしファーム-ABOUT",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function AboutPage() {
  return (
    <>
      <AppHeader variant="sub" />
      <main>
        <ol id="topic_path">
          <li><Link href="/">HOME</Link></li>
          <li>ABOUT</li>
        </ol>
        <div id="about_content">
          <section id="intoro">
            <h1>ふくにしファームについて</h1>
            <div className="flag-tablet">
              <div className="harf_column2">
                <img src="/img/producer.jpg" alt="生産者" />
              </div>
              <div className="harf_column2">
                <p>
                  地元信楽の陶器卸会社を定年退職後、老後の生きがいづくりのため一念発起。<br />
                  兼業米農家から未経験ぶどう農家への転身。数年間の修行を経て、土づくりからスタート。<br />
                  2004年バリアフリー観光農園としてふくにしファームを開園。
                  高齢者、障がい者、子ども、どなたでも自分でぶどう狩りができる農園をコンセプトに老人ホームや障がい者施設のイベントや、子ども会や子育てサークルなど、たくさんのご利用をいただいております。<br />
                  もちろん、車椅子でのご来園も可能です。<br />
                  皆様に愛され、おかげさまで令和6年度に20周年を迎えることができました。<br className="pc_hid" />
                  これからもふくにしファームをよろしくお願いいたします。
                </p>
              </div>
            </div>
          </section>
          <section id="topic_about">
            <h2>特徴</h2>
            <div className="slider">
              <div className="slides">
                <div className="slide">
                  <div className="slide-content">
                    <img src="/img/farm_inside.jpeg" alt="入場無料" className="slide-image" />
                    <div className="slide-text">
                      <h4>入場無料</h4>
                      <p>園内に入場される際に入場料をいただきません。</p>
                    </div>
                  </div>
                </div>
                <div className="slide">
                  <div className="slide-content">
                    <img src="/img/barrier_free.jpg" alt="バリアフリー" className="slide-image" />
                    <div className="slide-text">
                      <h4>バリアフリー</h4>
                      <p>
                        園内はバリアフリーに対応しており、<br className="pc_hid" />車いすの方でもぶどう狩りを楽しんでいただけます。
                      </p>
                    </div>
                  </div>
                </div>
                <div className="slide">
                  <div className="slide-content">
                    <img src="/img/low_wood.jpeg" alt="低位置に房がある" className="slide-image" />
                    <div className="slide-text">
                      <h4>低位置に房がある</h4>
                      <p>どのような方でも自分の手でぶどう狩りを楽しんでいただけます。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h2>園情報</h2>
            <div className="table-container">
              <table className="main-table">
                <tbody>
                  <tr>
                    <th>電話番号</th>
                    <td>090-6209-6206(福西 修)</td>
                  </tr>
                  <tr>
                    <th>FAX</th>
                    <td>0748-82-1983</td>
                  </tr>
                  <tr>
                    <th>開園時期</th>
                    <td>8月下旬から9月上旬頃</td>
                  </tr>
                  <tr>
                    <th>開園時間</th>
                    <td>8時30分頃から17時頃</td>
                  </tr>
                  <tr>
                    <th>支払方法</th>
                    <td>現金のみ</td>
                  </tr>
                  <tr>
                    <th>予約</th>
                    <td>可能</td>
                  </tr>
                  <tr>
                    <th>宅配</th>
                    <td>有り</td>
                  </tr>
                  <tr>
                    <th>SNS</th>
                    <td>
                      <a
                        href="https://www.instagram.com/fukunishi_farm/?igshid=MmIzYWVlNDQ5Yg%3D%3D"
                        target="_blank"
                      >
                        インスタグラム
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h2>お問い合わせ</h2>
            <p className="center">
              何かご意見やご感想、Webページについてなどございましたら
              <Link href="/contact">こちら</Link>
              からご連絡いただけますと幸いです。
            </p>
          </section>
        </div>
      </main>
      <p className="page_top"><a href="#top">ページトップ</a></p>
      <SiteFooter />
    </>
  );
}
