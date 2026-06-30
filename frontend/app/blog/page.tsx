import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import { formatBlogDate, getBlogPath, loadPublicBlogPosts } from "@/lib/blog";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "ふくにしファームのブログです。",
};

export default async function BlogPage() {
  const { posts, errorMessage } = await loadPublicBlogPosts(12);

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
            <div className="blog-grid">
              {posts.map((post) => (
                <article className="card blog-card" key={post.id}>
                  {post.eyecatch?.url ? (
                    <div className="blog-card__media">
                      <Image
                        src={post.eyecatch.url}
                        alt={post.title}
                        width={1200}
                        height={675}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="blog-card__media blog-card__media--placeholder" aria-label="写真なし">
                      <span>NO IMAGE</span>
                    </div>
                  )}
                  <div className="card__body blog-card__body">
                    <p className="news-card__date">{formatBlogDate(post.publishedAt)}</p>
                    <h3 className="card__title">{post.title}</h3>
                    <p className="card__text blog-card__excerpt">{post.excerpt}</p>
                    <Link href={getBlogPath(post)} className="button-link button-link--secondary">
                      記事を読む
                    </Link>
                  </div>
                </article>
              ))}
            </div>
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
