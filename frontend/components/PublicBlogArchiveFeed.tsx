import BlogCardGrid from "@/components/BlogCardGrid";
import type { BlogPost } from "@/lib/blog-types";
import Link from "next/link";

export default function PublicBlogArchiveFeed({
  posts,
  totalCount,
  page,
  limit,
  status,
  errorMessage,
}: {
  posts: BlogPost[] | null;
  totalCount: number;
  page: number;
  limit: number;
  status: "loaded" | "empty" | "error";
  errorMessage: string | null;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(limit, 1)));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const showPagination = totalCount > limit;
  const previousHref = currentPage <= 2 ? "/blog/archive" : `/blog/archive?page=${currentPage - 1}`;
  const nextHref = `/blog/archive?page=${currentPage + 1}`;

  if (status === "error") {
    return (
      <div className="card card__body">
        <p className="m-0">{errorMessage ?? "ブログ記事を読み込めませんでした。"}</p>
      </div>
    );
  }

  if (status === "empty" || !posts || posts.length === 0) {
    return (
      <div className="card card__body">
        <p className="m-0">現在表示できるブログ記事はありません。</p>
      </div>
    );
  }

  return (
    <>
      <BlogCardGrid posts={posts} />

      {showPagination ? (
        <div className="news-pagination" aria-label="Blog archive pagination">
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
