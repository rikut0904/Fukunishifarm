import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import type { Metadata } from "next";

const downloads = [
  { label: "R7_Pamphlet.pdf", href: "/PDF/R7_Pamphlet.pdf", section: "ちらし" },
  { label: "fukunishifarm_FAX.pdf", href: "/latex/fukunishifarm_FAX.pdf", section: "団体予約申込書" },
  { label: "shipping_fee.pdf", href: "/PDF/shipping_fee.pdf", section: "地域別発送料" },
];

export const metadata: Metadata = {
  title: "ダウンロード資料",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function DownloadPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>download</li>
        </ol>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Downloads</p>
            <h1 className="section__title">各種資料ダウンロード</h1>
          </div>
          <div className="card table-card">
            <table className="info-table download-table">
              <thead>
                <tr>
                  <th>区分</th>
                  <th>ファイル</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((item) => (
                  <tr key={item.href}>
                    <th>{item.section}</th>
                    <td><Link href={item.href} target="_blank">
                      {item.label}
                    </Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
