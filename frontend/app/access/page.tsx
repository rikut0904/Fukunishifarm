import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "アクセス方法",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function AccessPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>アクセス</li>
        </ol>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Access</p>
            <h1 className="section__title">アクセス方法</h1>
          </div>

          <div className="info-grid">
            <div className="card table-card">
              <table className="info-table">
                <tbody>
                  <tr>
                    <th>郵便番号</th>
                    <td>〒529-1812</td>
                  </tr>
                  <tr>
                    <th>住所</th>
                    <td>滋賀県甲賀市信楽町神山</td>
                  </tr>
                </tbody>
              </table>
              <div className="card__body">
                <p className="m-0">国道422号線沿い、株式会社しろやま付近です。</p>
                <p className="m-0">お越しになる際はぶどうののぼりを目印にお越しください。</p>
              </div>
            </div>

            <div className="card card__body">
              <h2 className="card__title">地図</h2>
              <div className="subtle-map">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d13095.691530438726!2d136.067471!3d34.85816500000001!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60015d8a2bba3a27%3A0xd560d7ffc8c78bc4!2z44G144GP44Gr44GX44OV44Kh44O844Og!5e0!3m2!1sja!2sjp!4v1693660143704!5m2!1sja!2sjp"
                  width={800}
                  height={400}
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Map"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
