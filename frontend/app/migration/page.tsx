import AppHeader from "@/components/AppHeader";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Migration Required",
  description: "データベースの初期化が必要です。",
};

export default function MigrationRequiredPage() {
  return (
    <div className="site-shell">
      <AppHeader variant="sub" />
      <main>
        <ol className="breadcrumb">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>migration</li>
        </ol>

        <section className="section">
          <div className="section__head">
            <p className="eyebrow">Setup</p>
            <h1 className="section__title">データベースの初期化が必要です</h1>
          </div>
          <div className="grid mt-6">
            <article className="card card__body">
              <p className="section__lead">
                まだ migration が完了していないため、管理画面と公開ページの一部機能を利用できません。
              </p>
              <p className="m-0">ターミナルで `make migrate` を実行してから、もう一度アクセスしてください。</p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
