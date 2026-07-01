import MicroCMSAdminPage from "@/components/MicroCMSAdminPage";

export default function AdminNewsPage() {
  return (
    <MicroCMSAdminPage
      eyebrow="News"
      title="お知らせ管理"
      lead="お知らせの編集は microCMS で行います。この画面ではローカル編集機能を提供しません。"
      endpointEnvValue={process.env.MICROCMS_NEWS_ENDPOINT}
      defaultEndpoint="news"
    />
  );
}
