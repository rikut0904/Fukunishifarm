"use client";

import { formatBlogDate } from "@/lib/blog";
import type { NewsItem } from "@/lib/news";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";

const PAGE_SIZE = 5;

function clampPage(page: number, totalPages: number) {
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.min(page, Math.max(totalPages, 1));
}

export default function PublicNewsFeed({
  items,
  errorMessage,
}: {
  items: NewsItem[] | null;
  errorMessage: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalItems = items?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const requestedPage = Number(searchParams.get("page") ?? 1);
  const currentPage = clampPage(requestedPage, totalPages);
  const visibleItems = items ? items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) : [];
  const showPagination = totalItems > PAGE_SIZE;

  const moveToPage = (page: number) => {
    const nextPage = clampPage(page, totalPages);
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  if (errorMessage) {
    return (
      <div className="card card__body">
        <p className="m-0">{errorMessage}</p>
      </div>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <div className="card card__body">
        <p className="m-0">現在表示できるお知らせはありません。</p>
      </div>
    );
  }

  return (
    <>
      <div className="news-feed">
        {visibleItems.map((item) => (
          <article className="card news-card" key={item.id}>
            <div className="card__body">
              <p className="news-card__date">{formatBlogDate(item.publishedAt)}</p>
              <p className="news-card__title">{item.title}</p>
            </div>
          </article>
        ))}
      </div>

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
              <button type="button" className="button-link button-link--secondary" onClick={() => moveToPage(currentPage - 1)}>
                前へ
              </button>
            )}
            {currentPage >= totalPages ? (
              <span className="button-link button-link--secondary" aria-disabled="true">
                次へ
              </span>
            ) : (
              <button type="button" className="button-link button-link--secondary" onClick={() => moveToPage(currentPage + 1)}>
                次へ
              </button>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
