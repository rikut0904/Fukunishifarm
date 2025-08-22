import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ダウンロード資料",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function DownloadPage() {
  return (
    <>
      <AppHeader variant="sub" />
      <main>
        <h1>各種資料ダウンロード</h1>
        <h2>ちらし</h2>
        <p>
          <a href="/PDF/R7_Pamphlet.pdf" target="_blank">R7_Pamphlet.pdf</a>
        </p>
        <h2>団体予約申込書</h2>
        <p>
          <a href="/latex/fukunishifarm_FAX.pdf" target="_blank">fukunishifarm_FAX.pdf</a>
        </p>
        <h2>地域別発送料</h2>
        <p>
          <a href="/PDF/shipping_fee.pdf" target="_blank">shipping_fee.pdf</a>
        </p>
        <p><br /></p>
      </main>
      <SiteFooter />
    </>
  );
}
