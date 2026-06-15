export type AdminMenuItem = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

export const adminMenuItems: AdminMenuItem[] = [
  {
    title: "ブドウ情報の編集",
    description: "品種名、説明文、画像設定、販売中の切り替えを編集します。",
    href: "/admin/grape",
  },
  {
    title: "お知らせの編集",
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
