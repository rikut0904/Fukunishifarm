import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import { formatBlogDate, getBlogContent, getBlogEyecatchUrl, loadPublicBlogPost } from "@/lib/blog";
import { renderHtmlContent } from "@/lib/html-sanitize";
import { htmlExcerpt } from "@/lib/html";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function buildBlogDescription(content: string) {
  return htmlExcerpt(content, 140);
}

export async function generateMetadata({
  params,
}: {
  params?: { slug: string } | Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const postId = resolvedParams?.slug ?? "";
  const { post, status } = await loadPublicBlogPost(postId);

  if (status === "empty" || !post) {
    notFound();
  }

  const content = getBlogContent(post);

  return {
    title: post.title,
    description: post.excerpt || buildBlogDescription(content) || "ふくにしファームのブログです。",
  };
}

export default async function BlogPostPage({
  params,
}: {
  params?: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const postId = resolvedParams?.slug ?? "";
  const { post, status, errorMessage } = await loadPublicBlogPost(postId);
  const eyecatchUrl = post ? getBlogEyecatchUrl(post) : "";

  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/blog">Blog</Link>
          </li>
          <li>{post ? post.title : "記事"}</li>
        </ol>

        {status === "error" ? (
          <section className="section">
            <div className="card card__body">
              <p className="m-0">{errorMessage ?? "ブログ記事を読み込めませんでした。"}</p>
            </div>
          </section>
        ) : post ? (
          <article className="section blog-article">
            <div className="section__head">
              <p className="eyebrow">Blog</p>
              <h1 className="section__title">{post.title}</h1>
              <div className="blog-article__meta">
                <span>{formatBlogDate(post.publishedAt)}</span>
                {post.category?.name ? <span>{post.category.name}</span> : null}
              </div>
            </div>

            {eyecatchUrl ? (
              <div className="blog-article__eyecatch">
                <Image
                  src={eyecatchUrl}
                  alt={post.title}
                  width={1440}
                  height={810}
                  className="h-full w-full object-cover"
                  priority
                  unoptimized
                />
              </div>
            ) : null}

            <div className="blog-article__excerpt card card__body">
              <p className="m-0">{post.excerpt}</p>
            </div>

            <div className="blog-article__content card card__body" dangerouslySetInnerHTML={{ __html: renderHtmlContent(getBlogContent(post)) }} />
            <div className="blog-article__footer">
              <Link href="/blog" className="button-link button-link--secondary">
                一覧へ戻る
              </Link>
            </div>
          </article>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
