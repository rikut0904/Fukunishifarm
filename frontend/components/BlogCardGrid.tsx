"use client";

import { formatBlogDate, getBlogEyecatchUrl, getBlogPath } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog-types";
import Image from "next/image";
import Link from "next/link";

type BlogCardGridProps = {
  posts: BlogPost[];
  compact?: boolean;
};

export default function BlogCardGrid({ posts, compact = false }: BlogCardGridProps) {
  return (
    <div className={`blog-grid${compact ? " blog-grid--compact" : ""}`}>
      {posts.map((post) => {
        const eyecatchUrl = getBlogEyecatchUrl(post);

        return (
          <article className="card blog-card" key={post.id}>
            {eyecatchUrl ? (
              <div className="blog-card__media">
                <Image
                  src={eyecatchUrl}
                  alt={post.title}
                  width={1200}
                  height={675}
                  className="h-full w-full object-cover"
                  unoptimized
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
        );
      })}
    </div>
  );
}
