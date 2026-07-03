"use client";

import { formatBlogDate } from "@/lib/blog";
import type { NewsItem } from "@/lib/news";
import Link from "next/link";

export default function PublicNewsFeed({
  items,
  total,
  page,
  limit,
  errorMessage,
}: {
  items: NewsItem[] | null;
  total: number;
  page: number;
  limit: number;
  errorMessage: string | null;
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const showPagination = total > limit;
  const previousHref = currentPage <= 2 ? "/news" : `/news?page=${currentPage - 1}`;
  const nextHref = `/news?page=${currentPage + 1}`;

  if (errorMessage) {
    return (
      <div className="card card__body">
        <p className="m-0">{errorMessage}</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="card card__body">
        <p className="m-0">現在表示できるお知らせはありません。</p>
      </div>
    );
  }

  return (
    <>
      <div className="news-feed">
        {items.map((item) => (
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
              <Link href={previousHref} className="button-link button-link--secondary">
                前へ
              </Link>
            )}
            {currentPage >= totalPages ? (
              <span className="button-link button-link--secondary" aria-disabled="true">
                次へ
              </span>
            ) : (
              <Link href={nextHref} className="button-link button-link--secondary">
                次へ
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
