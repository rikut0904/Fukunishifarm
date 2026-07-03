import AppHeader from "@/components/AppHeader";
import BlogCardGrid from "@/components/BlogCardGrid";
import SiteFooter from "@/components/SiteFooter";
import { loadPublicBlogPosts } from "@/lib/blog";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "ふくにしファームのブログです。",
};

export default async function BlogPage() {
  const { posts, errorMessage } = await loadPublicBlogPosts(1, 3);

  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>blog</li>
        </ol>

        <section className="section blog-hero">
          <div className="section__head">
            <p className="eyebrow">Blog</p>
            <h1 className="section__title">ブログ</h1>
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <h2 className="section__title">新着記事</h2>
          </div>

          {errorMessage ? (
            <div className="card card__body">
              <p className="m-0">{errorMessage}</p>
            </div>
          ) : posts && posts.length > 0 ? (
            <>
              <BlogCardGrid posts={posts} compact />
              <div className="blog-archive-cta">
                <div>
                  <p className="blog-archive-cta__eyebrow">Archive</p>
                </div>
                <Link href="/blog/archive" className="button-link button-link--secondary">
                  一覧を見る
                </Link>
              </div>
            </>
          ) : (
            <div className="card card__body">
              <p className="m-0">現在表示できるブログ記事はありません。</p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
