import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "ふくにしファームへのお問い合わせはこちらからどうぞ。",
};

const inquiryTypes = [
  "ぶどう狩りについて",
  "料金について",
  "アクセスについて",
  "その他",
];

export default function ContactPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>contact</li>
        </ol>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Contact</p>
            <h1 className="section__title">お問い合わせ</h1>

            <form className="contact-form">
              <div className="grid grid--2">
                <label className="contact-field">
                  <span>お名前</span>
                  <input className="admin-input" type="text" placeholder="例: 福西 太郎" />
                </label>

                <label className="contact-field">
                  <span>メールアドレス</span>
                  <input className="admin-input" type="email" placeholder="example@email.com" />
                </label>
              </div>

              <div className="grid grid--2">
                <label className="contact-field">
                  <span>お問い合わせ種別</span>
                  <select className="admin-input" defaultValue={inquiryTypes[0]}>
                    {inquiryTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="contact-field">
                  <span>件名</span>
                  <input className="admin-input" type="text" placeholder="例: アクセス方法について" />
                </label>
              </div>

              <label className="contact-field">
                <span>お問い合わせ内容</span>
                <textarea
                  className="admin-textarea"
                  rows={8}
                  placeholder="できるだけ具体的にご記載ください"
                />
              </label>

              <div className="contact-form__footer">
                <button type="button" className="button-link button-link--primary" disabled>
                  送信する
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
