import ContactForm from "@/components/ContactForm";
import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "ふくにしファームへのお問い合わせはこちらからどうぞ。",
};

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
            <ContactForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
