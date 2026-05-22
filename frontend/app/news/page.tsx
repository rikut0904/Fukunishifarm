import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

const grapeStatuses = [
  { name: "竜宝", image: "/img/ryuhou.jpeg", focus: "center 40%", text: "本年度販売終了いたしました。" },
  { name: "シナノスマイル", image: "/img/shinano.jpeg", focus: "center 38%", text: "本年度販売終了いたしました。" },
  { name: "藤稔", image: "/img/fujiminori_2025.jpeg", focus: "center 32%", text: "本年度販売終了いたしました。" },
  { name: "ピオーネ", image: "/img/pione.jpeg", focus: "center 44%", text: "本年度販売終了いたしました。" },
  { name: "シャインマスカット", image: "/img/syain.jpeg", focus: "center 35%", text: "本年度販売終了いたしました。" },
];

export const metadata: Metadata = {
  title: "News",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function NewsPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>news</li>
        </ol>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Status</p>
            <h1 className="section__title">販売状況</h1>
          </div>
          <p className="section__lead">ふくにしファームが販売しているぶどうの状況をお知らせします。</p>

          <div className="grid mt-6">
            <article className="card card__body">
              <h2 className="card__title">News</h2>
              <ul className="list">
                <li>2026/05/22 : サイトをリニューアルオープンいたしました。</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section section--soft">
          <div className="section__head">
            <p className="eyebrow">Ripeness</p>
            <h2 className="section__title">食べごろ</h2>
          </div>
          <div className="grid grid--2">
            {grapeStatuses.map((grape) => (
              <article className="card" key={grape.name}>
                <div className="card__media card__media--portrait">
                  <Image
                    src={grape.image}
                    alt={grape.name}
                    width={900}
                    height={675}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: grape.focus }}
                  />
                </div>
                <div className="card__body">
                  <h3 className="card__title">{grape.name}</h3>
                  <span className="status">{grape.text}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
