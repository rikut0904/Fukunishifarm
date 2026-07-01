export type AdminMenuItem = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

function buildMicroCMSApiUrl(serviceDomain: string, endpoint: string) {
  const normalizedServiceDomain = serviceDomain.trim();
  const normalizedEndpoint = endpoint.trim();
  if (!normalizedServiceDomain) {
    return "";
  }

  return `https://${normalizedServiceDomain}.microcms.io/apis/${normalizedEndpoint}`;
}

export function buildAdminMenuItems(serviceDomain: string, blogEndpoint: string, newsEndpoint: string): AdminMenuItem[] {
  const blogHref = buildMicroCMSApiUrl(serviceDomain, blogEndpoint || "blogs");
  const newsHref = buildMicroCMSApiUrl(serviceDomain, newsEndpoint || "news");

  return [
    {
      title: "ぶどう情報",
      description: "品種名、説明文、画像設定、販売中の切り替えを編集します。",
      href: "/admin/grape",
    },
    {
      title: "お問い合わせ管理",
      description: "お問い合わせの一覧確認と対応状況の管理を行います。",
      href: "/admin/contact",
    },
    {
      title: "ブログ管理",
      description: "microCMS 上でブログ記事を管理します。",
      href: blogHref,
    },
    {
      title: "お知らせ管理",
      description: "microCMS 上でお知らせを管理します。",
      href: newsHref,
    },
    {
      title: "ユーザー管理",
      description: "管理者ユーザーの追加、編集、権限管理を行います。",
      href: "/admin/users",
      badge: "準備中",
    },
  ];
}

export const adminMenuItems = buildAdminMenuItems(
  process.env.MICROCMS_SERVICE_DOMAIN || "fukunishifarm",
  process.env.MICROCMS_BLOG_ENDPOINT || "blogs",
  process.env.MICROCMS_NEWS_ENDPOINT || "news",
);
