import Link from "next/link";
import { NAV_ITEMS } from "./navItems";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <section>
            <h3 className="footer__title">ふくにしファーム</h3>
            <p className="m-0 max-w-md text-sm leading-7 text-[var(--muted)]">
              滋賀県甲賀市信楽町で、自然に囲まれたぶどう狩りをお楽しみいただけます。
              入園無料、バリアフリー対応で、どなたでも訪れやすい観光農園を目指しています。
            </p>
          </section>
          <section>
            <h3 className="footer__title">Information</h3>
            <div className="grid gap-2 text-sm">
              <p className="m-0">郵便番号: 〒529-1812</p>
              <p className="m-0">住所: 滋賀県甲賀市信楽町神山</p>
              <p className="m-0">電話番号: 090-6209-6206(福西 修)</p>
            </div>
          </section>
        </div>
        <div className="footer__meta">
          <small>Copyright &copy; 2024 - 2026 ふくにしファーム, All Rights Reserved.</small>
        </div>
      </div>
    </footer>
  );
}
