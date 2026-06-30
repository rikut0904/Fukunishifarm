export type AdminMenuItem = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

export const adminMenuItems: AdminMenuItem[] = [
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
    description: "ブログの一覧を作成・編集します。",
    href: `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/apis/${process.env.MICROCMS_BLOG_ENDPOINT}`,
  },
  {
    title: "お知らせ管理",
    description: "お知らせの一覧を作成・並び替え・編集します。",
    href: "/admin/news",
  },
  {
    title: "ユーザー管理",
    description: "管理者ユーザーの追加、編集、権限管理を行います。",
    href: "/admin/users",
    badge: "準備中",
  },
];
