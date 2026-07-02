import AppHeader from "@/components/AppHeader";
import ResponsiveCarousel from "@/components/ResponsiveCarousel";
import SiteFooter from "@/components/SiteFooter";
import { loadPublicGrapeCatalog } from "@/lib/grapes";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

function varietyCard(item: { name: string; description: string; imagePath: string; imageFocus: string; isOnSale: boolean }) {
  return (
    <article className="card">
      <div className="card__media card__media--portrait">
        <Image
          src={item.imagePath}
          alt={item.name}
          width={900}
          height={675}
          className="h-full w-full object-cover"
          style={{ objectPosition: item.imageFocus }}
        />
      </div>
      <div className="card__body">
        <h3 className="card__title">{item.name}</h3>
        <p className="card__text">{item.description}</p>
        <p className="status">{item.isOnSale ? "販売中" : "本年度販売終了いたしました。"}</p>
      </div>
    </article>
  );
}

export const metadata: Metadata = {
  title: "ふくにしファーム",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default async function Home() {
  const { catalog, errorMessage } = await loadPublicGrapeCatalog(() => redirect("/migration"));
  const varietySlides = catalog
    ? catalog.items.map((item) => ({
        id: `${item.id}`,
        content: varietyCard(item),
      }))
    : [];

  return (
    <div className="site-shell">
      <AppHeader />
      <main>
        <section className="hero">
          <div className="hero__panel">
            <div className="hero__copy">
              <div className="hero__badge-row">
                <span className="tag">入園無料</span>
                <span className="tag">バリアフリー</span>
                <span className="tag tag--accent">直売</span>
              </div>
              <p className="eyebrow mt-5">Fukunishi Farm</p>
              <h1 className="hero__headline">ふくにしファーム<br />ぶどう狩り</h1>
              <p className="hero__text">
                焼き物で有名な信楽町。自然に囲まれたのどかな高原。その最高峰の笹ヶ岳のふもとで太陽と水の恵みをいっぱい受け育った「紫香楽高原ぶどう」ぶどう狩りをお楽しみいただけます。入園無料ですので、ぜひご来園ください。
              </p>
              <div className="hero__cta">
                <Link href="/reservation" className="button-link button-link--primary">
                  ご予約について
                </Link>
              </div>
            </div>
          </div>
          <div className="hero__panel hero__media">
            <Image
              src="/img/farm_inside.jpeg"
              alt="ふくにしファームの園内"
              width={1600}
              height={1200}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Varieties</p>
            <h2 className="section__title">販売種</h2>
            <p className="section__lead">現地で楽しめる主な品種を、味わいの特徴とあわせてご紹介します。</p>
          </div>
          {errorMessage ? (
            <div className="card card__body">
              <p className="m-0">{errorMessage}</p>
            </div>
          ) : varietySlides.length > 0 ? (
            <ResponsiveCarousel ariaLabel="販売種のカルーセル" items={varietySlides} desktopColumns={2} />
          ) : (
            <div className="card card__body">
              <p className="m-0">現在表示できるぶどう情報はありません。</p>
            </div>
          )}
        </section>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Pricing</p>
            <h2 className="section__title">ぶどう狩り料金</h2>
          </div>
          <div className="price-grid">
            <article className="card table-card">
              <div className="card__body">
                <h3 className="card__title">お持ち帰り</h3>
                <h4 className="card__subtitle">
                  <span className="subtitle-inline">
                    竜宝・シナノスマイル
                    <br className="subtitle-mobile-break" aria-hidden="true" />
                    藤稔・ピオーネ
                  </span>
                  <span className="subtitle-tablet">
                    竜宝・シナノスマイル
                    <br />
                    藤稔・ピオーネ
                  </span>
                </h4>
              </div>
              <table className="info-table price-table">
                <tbody>
                  <tr>
                    <th>1房</th>
                    <td>1,200円</td>
                  </tr>
                  <tr>
                    <th>1パック</th>
                    <td>1,200円</td>
                  </tr>
                </tbody>
              </table>
              <div className="card__body">
                <h4 className="card__subtitle">シャインマスカット</h4>
                <p className="note m-0">量り売りとなっております。</p>
              </div>
            </article>
            <article className="card table-card">
              <div className="card__body">
                <h3 className="card__title">発送・進物用</h3>
                <h4 className="card__subtitle">
                  <span className="subtitle-inline">
                    竜宝・シナノスマイル
                    <br className="subtitle-mobile-break" aria-hidden="true" />
                    藤稔・ピオーネ
                  </span>
                  <span className="subtitle-tablet">
                    竜宝・シナノスマイル
                    <br />
                    藤稔・ピオーネ
                  </span>
                </h4>
              </div>
              <table className="info-table price-table">
                <tbody>
                  <tr>
                    <th>2房入り</th>
                    <td>3,200円</td>
                  </tr>
                  <tr>
                    <th>3房入り</th>
                    <td>4,400円</td>
                  </tr>
                </tbody>
              </table>
              <div className="card__body">
                <h4 className="card__subtitle">シャインマスカット</h4>
                <p className="note">1房につき上記金額プラス1,000円となります。</p>
                <p className="note">
                  送料は別となっております。送料は
                  <Link href="/PDF/shipping_fee.pdf" target="_blank">
                    こちら
                  </Link>
                  をご覧ください。
                </p>
                <p className="note m-0">※竜宝の発送は承っておりません。</p>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
