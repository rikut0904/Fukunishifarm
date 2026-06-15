import AppHeader from "@/components/AppHeader";
import ResponsiveCarousel from "@/components/ResponsiveCarousel";
import SiteFooter from "@/components/SiteFooter";
import { loadPublicGrapeCatalog } from "@/lib/grapes";
import { loadPublicNewsCatalog } from "@/lib/news";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;

export const metadata: Metadata = {
  title: "News",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

function formatNewsDate(date: string) {
  return date.replaceAll("-", "/");
}

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
        <p className="news-sale-card__title">{item.name}</p>
        <span className="status">{item.isOnSale ? "販売中" : "本年度販売終了いたしました。"}</span>
      </div>
    </article>
  );
}

function clampPage(page: number, totalPages: number) {
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.min(page, Math.max(totalPages, 1));
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: { page?: string | string[] } | Promise<{ page?: string | string[] }>;
}) {
  const { catalog: grapeCatalog, errorMessage: grapeErrorMessage } = await loadPublicGrapeCatalog(() => redirect("/migration"));
  const { catalog, errorMessage } = await loadPublicNewsCatalog(() => redirect("/migration"));
  const resolvedSearchParams = await searchParams;
  const pageValue = Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams.page[0] : resolvedSearchParams?.page;
  const requestedPage = Number(pageValue ?? 1);
  const totalItems = catalog?.items.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = clampPage(requestedPage, totalPages);
  const visibleItems = catalog ? catalog.items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) : [];
  const showPagination = totalItems > PAGE_SIZE;
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
          
          {errorMessage ? (
            <div className="card card__body">
              <p className="m-0">{errorMessage}</p>
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="news-feed">
              {visibleItems.map((item) => (
                <article className="card news-card" key={item.id}>
                  <div className="card__body">
                    <p className="news-card__date">{formatNewsDate(item.date)}</p>
                    <p className="news-card__title">{item.title}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card card__body">
              <p className="m-0">現在表示できるお知らせはありません。</p>
            </div>
          )}

          {showPagination ? (
            <div className="news-pagination" aria-label="News pagination">
              <span className="news-pagination__summary">
                {currentPage} / {totalPages}
              </span>
              <div className="news-pagination__actions">
                {currentPage <= 1 ? (
                  <span className="button-link button-link--secondary" aria-disabled="true">
                    前へ
                  </span>
                ) : (
                  <Link href={`/news?page=${currentPage - 1}`} className="button-link button-link--secondary">
                    前へ
                  </Link>
                )}
                {currentPage >= totalPages ? (
                  <span className="button-link button-link--secondary" aria-disabled="true">
                    次へ
                  </span>
                ) : (
                  <Link href={`/news?page=${currentPage + 1}`} className="button-link button-link--secondary">
                    次へ
                  </Link>
                )}
              </div>
            </div>
          ) : null}
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
