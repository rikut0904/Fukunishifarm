import AppHeader from "../components/AppHeader";
import SiteFooter from "../components/SiteFooter";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "ふくにしファーム-滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
  description: "滋賀県甲賀市信楽町にてぶどう狩りを行っています。",
};

export default function Home() {
  return (
    <>
      <AppHeader />
      <main>
        <div id="main_content">
          <h6>ふくにしファームぶどう狩り</h6>
          <div className="center">
            <p>焼き物で有名な信楽町。自然に囲まれたのどかな高原。</p>
            <p>
              その最高峰の笹ヶ岳のふもとで太陽と水の恵みをいっぱい受け育った「紫香楽高原ぶどう」
            </p>
            <p>ぶどう狩りをお楽しみいただけます。</p>
            <p>入園無料ですので、ぜひご来園ください</p>
          </div>

          <h1>臨時お知らせ</h1>
          <div className="news-info">
            <ul>
              <li>
                料金を変更させていただきました。詳しくは
                <Link href="/price">こちら</Link>をご覧ください。
              </li>
            </ul>
          </div>

          <h1>販売種</h1>
          <div className="slider relative z-10 w-[95%] md:w-[85%] lg:w-[60%] text-center overflow-hidden flex items-center justify-center mx-auto">
            <div className="slides flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-5">
              <div className="slide snap-start flex-shrink-0 w-full rounded-lg bg-gray-100 flex flex-col items-center justify-center box-border mr-0 overflow-hidden">
                <div className="slide-content flex flex-col md:flex-row w-full p-0">
                  <Image src="/img/ryuhou.jpeg" alt="竜宝" width={640} height={480} className="slide-image w-full md:w-2/5 h-auto object-cover rounded-lg" />
                  <div className="slide-text flex-1 p-5 flex flex-col justify-center">
                    <h4>竜宝</h4>
                    <p>
                      大粒で薄赤紫色。とろけるような甘さが特徴であり、ジューシーで触感の良い品種です。
                      房から粒が取れやすいため輸送には不向きなため、現地でのみの販売です。
                    </p>
                  </div>
                </div>
              </div>
              <div className="slide snap-start flex-shrink-0 w-full rounded-lg bg-gray-100 flex flex-col items-center justify-center box-border mr-0 overflow-hidden">
                <div className="slide-content flex flex-col md:flex-row w-full p-0">
                  <Image src="/img/shinano.jpeg" alt="シナノスマイル" width={640} height={480} className="slide-image w-full md:w-2/5 h-auto object-cover rounded-lg" />
                  <div className="slide-text flex-1 p-5 flex flex-col justify-center">
                    <h4>シナノスマイル</h4>
                    <p>
                      酸味と甘未のバランスがちょうどよく、すっきりとした味わいが人気の品種です。
                    </p>
                  </div>
                </div>
              </div>
              <div className="slide snap-start flex-shrink-0 w-full rounded-lg bg-gray-100 flex flex-col items-center justify-center box-border mr-0 overflow-hidden">
                <div className="slide-content flex flex-col md:flex-row w-full p-0">
                  <Image src="/img/fujiminori.jpeg" alt="藤稔" width={640} height={480} className="slide-image w-full md:w-2/5 h-auto object-cover rounded-lg" />
                  <div className="slide-text flex-1 p-5 flex flex-col justify-center">
                    <h4>藤稔</h4>
                    <p>
                      糖度が高く酸味、渋みが少ないのが特徴の品種です。
                      適度な酸味と十分な甘みが口中に広がる贅沢な味です。
                    </p>
                  </div>
                </div>
              </div>
              <div className="slide snap-start flex-shrink-0 w-full rounded-lg bg-gray-100 flex flex-col items-center justify-center box-border mr-0 overflow-hidden">
                <div className="slide-content flex flex-col md:flex-row w-full p-0">
                  <Image src="/img/pione.jpeg" alt="ピオーネ" width={640} height={480} className="slide-image w-full md:w-2/5 h-auto object-cover rounded-lg" />
                  <div className="slide-text flex-1 p-5 flex flex-col justify-center">
                    <h4>ピオーネ</h4>
                    <p>
                      糖度が高くて香りもよく、適度な酸味で濃厚な味わいが人気の品種です。
                    </p>
                  </div>
                </div>
              </div>
              <div className="slide snap-start flex-shrink-0 w-full rounded-lg bg-gray-100 flex flex-col items-center justify-center box-border mr-0 overflow-hidden">
                <div className="slide-content flex flex-col md:flex-row w-full p-0">
                  <Image src="/img/syain.jpeg" alt="シャインマスカット" width={640} height={480} className="slide-image w-full md:w-2/5 h-auto object-cover rounded-lg" />
                  <div className="slide-text flex-1 p-5 flex flex-col justify-center">
                    <h4>シャインマスカット</h4>
                    <p>
                      種なしで皮ごと食べられ、さわやかでジューシー、酸味も低く贅沢な甘さが大人気！
                      肉質は少し片目で、プリプリとした触感が楽しめます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h1>ぶどう狩り料金</h1>
          <p>※直売も可能となっております。</p>
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
              <p className="center">量り売りとなっております。</p>
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
              <p className="center">1房につき上記金額プラス1,000円となります。</p>
              <p className="under"></p>
              <p className="center">送料は別となっております。</p>
              <p className="center">
                送料は<Link href="/PDF/shipping_fee.pdf" target="_blank">こちら</Link>をご覧ください。
              </p>
              <p className="center">※竜宝の発送は承っておりません。</p>
            </div>
          </div>

          <div className="Instagram">
            <h2 className="font-english">Instagram</h2>
            <p className="center">
              Instagramのアカウントは
              <Link
                href="https://www.instagram.com/fukunishi_farm/?igshid=MmIzYWVlNDQ5Yg%3D%3D"
                target="_blank"
              >
                こちら
              </Link>
              をクリック。
            </p>
          </div>
        </div>
      </main>
      <p className="page_top">
        <a href="#top">ページトップ</a>
      </p>
      <SiteFooter />
    </>
  );
}
