import AppHeader from "@/components/AppHeader";
import PublicBlogArchiveFeed from "@/components/PublicBlogArchiveFeed";
import SiteFooter from "@/components/SiteFooter";
import { loadPublicBlogPosts } from "@/lib/blog";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog Archive",
  description: "ふくにしファームのブログ一覧です。",
};

type BlogArchivePageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

function parseArchivePage(value: string | undefined) {
  const page = Number(value ?? "1");
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

export default async function BlogArchivePage({ searchParams }: BlogArchivePageProps) {
  const params = (await searchParams) ?? {};
  const page = parseArchivePage(params.page);
  const { posts, totalCount, limit, errorMessage } = await loadPublicBlogPosts(page, 15);

  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/blog">blog</Link>
          </li>
          <li>archive</li>
        </ol>

        <section className="section blog-hero">
          <div className="section__head">
            <p className="eyebrow">Blog Archive</p>
            <h1 className="section__title">ブログ一覧</h1>
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <h2 className="section__title">すべての記事</h2>
          </div>

          <PublicBlogArchiveFeed posts={posts} totalCount={totalCount} page={page} limit={limit} errorMessage={errorMessage} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
