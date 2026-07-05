import AppHeader from "@/components/AppHeader";
import PublicNewsFeed from "@/components/PublicNewsFeed";
import ResponsiveCarousel from "@/components/ResponsiveCarousel";
import SiteFooter from "@/components/SiteFooter";
import { loadPublicGrapeCatalog } from "@/lib/grapes";
import { loadPublicNewsCatalog } from "@/lib/news";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

type NewsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

function parseNewsPage(value: string | undefined) {
  const page = Number(value ?? "1");
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function getSaleStatusLabel(status: "preparing" | "on_sale" | "ended") {
  switch (status) {
    case "preparing":
      return "販売開始まで今しばらくお待ちください。";
    case "on_sale":
      return "販売中!!";
    case "ended":
    default:
      return "本年度販売終了いたしました。";
  }
}

function saleStatusCard(item: { name: string; imagePath: string; imageFocus: string; saleStatus: "preparing" | "on_sale" | "ended" }) {
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
        <p className="news-sale-card__title">{item.name}</p>
        <span className="status">{getSaleStatusLabel(item.saleStatus)}</span>
      </div>
    </article>
  );
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = (await searchParams) ?? {};
  const page = parseNewsPage(params.page);
  const { catalog: grapeCatalog, errorMessage: grapeErrorMessage } = await loadPublicGrapeCatalog(() => redirect("/migration"));
  const { catalog, errorMessage } = await loadPublicNewsCatalog(page, 5);
  const saleSlides = grapeCatalog
    ? grapeCatalog.items.map((item) => ({
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
            <p className="eyebrow">News</p>
            <h1 className="section__title">お知らせ</h1>
          </div>

          <PublicNewsFeed
            items={catalog?.items ?? null}
            total={catalog?.total ?? 0}
            page={catalog?.page ?? page}
            limit={catalog?.limit ?? 5}
            errorMessage={errorMessage}
          />
        </section>

        <section className="section section--soft">
          <div className="section__head">
            <p className="eyebrow">Sale Status</p>
            <h2 className="section__title">販売状況</h2>
          </div>
          {grapeErrorMessage ? (
            <div className="card card__body">
              <p className="m-0">{grapeErrorMessage}</p>
            </div>
          ) : saleSlides.length > 0 ? (
            <ResponsiveCarousel ariaLabel="販売状況のカルーセル" items={saleSlides} desktopColumns={2} />
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
