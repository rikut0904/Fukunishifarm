import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ふくにしファーム-アクセス方法",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function AccessPage() {
  return (
    <>
      <AppHeader variant="sub" />
      <main>
        <ol id="topic_path">
          <li><Link href="/">HOME</Link></li>
          <li>アクセス</li>
        </ol>
        <div>
          <h1>アクセス方法</h1>
          <section id="園情報">
            <div className="info-container">
              <table className="main-table">
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
              <div className="table-section inside">
                <p>国道422号線沿い、株式会社しろやま付近です。</p>
                <p>
                  お越しになる際はぶどうののぼりを
                  <br className="pc_hid" />
                  目印にお越しください。
                </p>
              </div>
            </div>
            <h2>地図</h2>
            <div id="map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d13095.691530438726!2d136.067471!3d34.85816500000001!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60015d8a2bba3a27%3A0xd560d7ffc8c78bc4!2z44G144GP44Gr44GX44OV44Kh44O844Og!5e0!3m2!1sja!2sjp!4v1693660143704!5m2!1sja!2sjp"
                width={800}
                height={400}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Map"
              ></iframe>
            </div>
          </section>
        </div>
      </main>
      <p className="page_top"><a href="#top">ページトップ</a></p>
      <SiteFooter />
    </>
  );
}
