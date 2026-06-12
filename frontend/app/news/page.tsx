import AppHeader from "@/components/AppHeader";
import ResponsiveCarousel from "@/components/ResponsiveCarousel";
import SiteFooter from "@/components/SiteFooter";
import { loadPublicGrapeCatalog } from "@/lib/grapes";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function saleStatusCard(item: { name: string; imagePath: string; imageFocus: string; isOnSale: boolean }) {
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
        <span className="status">{item.isOnSale ? "販売中" : "本年度販売終了いたしました。"}</span>
      </div>
    </article>
  );
}

export const metadata: Metadata = {
  title: "News",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default async function NewsPage() {
  const { catalog, errorMessage } = await loadPublicGrapeCatalog(() => redirect("/migration"));
  const statusSlides = catalog
    ? catalog.items.map((item) => ({
        id: `${item.id}`,
        content: saleStatusCard(item),
      }))
    : [];

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
            <p className="eyebrow">Sale Status</p>
            <h2 className="section__title">販売状況</h2>
          </div>
          {errorMessage ? (
            <div className="card card__body">
              <p className="m-0">{errorMessage}</p>
            </div>
          ) : statusSlides.length > 0 ? (
            <ResponsiveCarousel ariaLabel="販売状況のカルーセル" items={statusSlides} desktopColumns={2} />
          ) : (
            <div className="card card__body">
              <p className="m-0">現在表示できる販売状況はありません。</p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
