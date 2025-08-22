import Link from "next/link";
import { NAV_ITEMS } from "./navItems";

export default function SiteFooter() {
  return (
    <footer>
      <h3 className="heading font-english">Information</h3>
      <table className="info">
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
      <ul className="font-english">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
      <small>
        Copyright &copy; 2024 - 2025 ふくにしファーム, All Rights Reserved.
      </small>
    </footer>
  );
}
