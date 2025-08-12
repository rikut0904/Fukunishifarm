import AppHeader from "../../components/AppHeader";
import SiteFooter from "../../components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "価格変更のお知らせ",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function PricePage() {
  return (
    <>
      <AppHeader variant="sub" />
      <main>
        <div className="price_content">
          <h1>価格変更のお知らせ</h1>
          <div className="center">
            <p>いつもふくにしファームをご愛顧いただき、誠にありがとうございます。</p>
            <p>
              <br />このたび、昨今の物価上昇や原材料費の高騰に伴い、やむを得ずぶどうの価格を改定させていただくこととなりました。
            </p>
            <p>
              日頃から楽しみにしていただいている皆様にはご不便をおかけすることとなり、心よりお詫び申し上げます。
            </p>
            <p>
              <br />引き続き、お客様にご満足いただける品質のぶどうをお届けできるよう、スタッフ一同努力してまいります。
            </p>
            <p>何卒ご理解賜りますようお願い申し上げます。</p>
            <p>
              <br />今後ともふくにしファームのぶどうをよろしくお願いいたします。
            </p>
          </div>
          <h1>変更価格</h1>
          <div className="flag">
            <div className="harf_column1">
              <h2>お持ち帰り</h2>
              <h3>
                竜宝・シナノスマイル
                <br />
                藤稔・ピオーネ
              </h3>
              <div className="table-container">
                <table className="main-table">
                  <tbody>
                    <tr>
                      <th>1房</th>
                      <td>1,200円</td>
                    </tr>
                    <tr>
                      <th>1パック</th>
                      <td>1,200円</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h3>シャインマスカット</h3>
              <p className="center">量り売り</p>
            </div>
            <div className="harf_column1">
              <h2>発送・進物用</h2>
              <h3>
                竜宝・シナノスマイル
                <br />
                藤稔・ピオーネ
              </h3>
              <div className="table-container">
                <table className="main-table">
                  <tbody>
                    <tr>
                      <th>2房入り</th>
                      <td>3,200円</td>
                    </tr>
                    <tr>
                      <th>3房入り</th>
                      <td>4,400円</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h3>シャインマスカット</h3>
              <p className="center">1房につき上記金額プラス1,000円</p>
            </div>
          </div>
        </div>
      </main>
      <p className="page_top"><a href="#top">ページトップ</a></p>
      <SiteFooter />
    </>
  );
}
