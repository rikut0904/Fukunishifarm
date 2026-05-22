import AppHeader from "@/components/AppHeader";
import ResponsiveCarousel from "@/components/ResponsiveCarousel";
import SiteFooter from "@/components/SiteFooter";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function AboutPage() {
  const featureSlides = [
    {
      id: "free-entry",
      content: (
        <article className="card">
          <div className="card__media">
            <Image src="/img/farm_inside.jpeg" alt="入場無料" width={1600} height={1200} className="h-full w-full object-cover" />
          </div>
          <div className="card__body">
            <h3 className="card__title">入場無料</h3>
            <p className="card__text">園内に入場される際に入場料をいただきません。</p>
          </div>
        </article>
      ),
    },
    {
      id: "barrier-free",
      content: (
        <article className="card">
          <div className="card__media">
            <Image src="/img/barrier_free.jpg" alt="バリアフリー" width={1600} height={1200} className="h-full w-full object-cover" />
          </div>
          <div className="card__body">
            <h3 className="card__title">バリアフリー</h3>
            <p className="card__text">園内はバリアフリーに対応しており、車いすの方でもぶどう狩りを楽しんでいただけます。</p>
          </div>
        </article>
      ),
    },
    {
      id: "low-wood",
      content: (
        <article className="card">
          <div className="card__media">
            <Image src="/img/low_wood.jpeg" alt="低位置に房がある" width={1600} height={1200} className="h-full w-full object-cover" />
          </div>
          <div className="card__body">
            <h3 className="card__title">低位置に房がある</h3>
            <p className="card__text">どのような方でも自分の手でぶどう狩りを楽しんでいただけます。</p>
          </div>
        </article>
      ),
    },
  ];

  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>about</li>
        </ol>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">About</p>
            <h1 className="section__title">ふくにしファームについて</h1>
          </div>
          <div className="info-grid">
            <div className="card">
              <div className="card__media">
                <Image
                  src="/img/producer.jpg"
                  alt="生産者"
                  width={800}
                  height={600}
                  sizes="(max-width: 768px) 90vw, 420px"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="card card__body">
              <p className="m-0">
                地元信楽の陶器卸会社を定年退職後、老後の生きがいづくりのため一念発起。兼業米農家から未経験ぶどう農家への転身。数年間の修行を経て、土づくりからスタート。2004年バリアフリー観光農園としてふくにしファームを開園。
              </p>
              <p>
                高齢者、障がい者、子ども、どなたでも自分でぶどう狩りができる農園をコンセプトに老人ホームや障がい者施設のイベントや、子ども会や子育てサークルなど、たくさんのご利用をいただいております。
              </p>
              <p>
                もちろん、車椅子でのご来園も可能です。皆様に愛され、おかげさまで令和6年度に20周年を迎えることができました。
                <br className="hidden sm:block" />
                これからもふくにしファームをよろしくお願いいたします。
              </p>
            </div>
          </div>
        </section>

        <section className="section section--soft">
          <div className="section__head">
            <p className="eyebrow">Features</p>
            <h2 className="section__title">特徴</h2>
            <p className="section__lead">園内の特長を、写真と一緒に確認できます。</p>
          </div>
          <ResponsiveCarousel ariaLabel="特徴のカルーセル" items={featureSlides} desktopColumns={3} />
        </section>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Information</p>
            <h2 className="section__title">園情報</h2>
          </div>
          <div className="card table-card">
            <table className="info-table">
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
                    <Link href="https://www.instagram.com/fukunishi_farm/?igshid=MmIzYWVlNDQ5Yg%3D%3D" target="_blank">
                      インスタグラム
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
