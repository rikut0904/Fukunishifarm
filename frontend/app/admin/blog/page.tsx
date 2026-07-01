import MicroCMSAdminPage from "@/components/MicroCMSAdminPage";

export default function AdminBlogPage() {
  return (
    <MicroCMSAdminPage
      eyebrow="Blog"
      title="ブログ管理"
      lead="ブログ記事の編集は microCMS で行います。この画面ではローカル編集機能を提供しません。"
      endpointEnvValue={process.env.MICROCMS_BLOG_ENDPOINT}
      defaultEndpoint="blogs"
    />
  );
}
