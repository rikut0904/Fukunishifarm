"use client";

import AdminPageShell from "@/components/AdminPageShell";
import { ApiError } from "@/lib/api";
import { fetchAdminContactCatalog, type AdminContactMessage } from "@/lib/contact";
import { Loader2, LogOut, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

type Toast = {
  kind: "success" | "error";
  message: string;
};

type ContactMessagesPanelProps = {
  token: string;
  onSignOut: () => void;
};

function isAuthExpired(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCategoryLabel(category: string) {
  const mapping: Record<string, string> = {
    general: "一般",
    reservation: "予約",
    price: "料金",
    access: "アクセス",
  };

  return mapping[category] ?? category;
}

function getSummary(messages: AdminContactMessage[]) {
  return {
    total: messages.length,
    latest: messages[0]?.createdAt ?? null,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "resolved":
      return <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">対応済</span>;
    case "in_progress":
      return <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">対応中</span>;
    case "pending":
    default:
      return <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">未対応</span>;
  }
}

export default function ContactMessagesPanel({ token, onSignOut }: ContactMessagesPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("unresolved");
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [limit] = useState<number>(25);
  const [toast, setToast] = useState<Toast | null>(null);

  const loadMessages = useCallback(async () => {
    await Promise.resolve();
    setStatus({ kind: "loading" });

    try {
      const response = await fetchAdminContactCatalog(token, filterStatus, page, limit);
      setMessages(response.messages);
      setTotalCount(response.total);
      setStatus({ kind: "ready" });
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "お問い合わせを読み込めませんでした。",
      });
    }
  }, [onSignOut, token, filterStatus, page, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMessages();
  }, [loadMessages]);

  const handleFilterChange = useCallback((newStatus: string) => {
    setFilterStatus(newStatus);
    setPage(1);
  }, []);

  const totalPages = useMemo(() => Math.ceil(totalCount / limit), [totalCount, limit]);

  const summary = useMemo(() => getSummary(messages), [messages]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <AdminPageShell
      title="お問い合わせ管理"
      lead="実際に送信されたお問い合わせを一覧で確認できます。"
      actions={
        <button type="button" className="button-link button-link--secondary" onClick={() => void loadMessages()}>
          <RefreshCcw className="h-4 w-4" />
          再読み込み
        </button>
      }
    >
      {status.kind === "loading" ? (
        <div className="admin-login-state">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-strong)]" />
          <p className="m-0">読み込み中...</p>
        </div>
      ) : null}

      {status.kind === "error" ? (
        <div className="admin-error-panel">
          <p className="admin-error">{status.message}</p>
          <div className="admin-error-panel__actions">
            <button type="button" className="button-link button-link--primary" onClick={() => void loadMessages()}>
              <RefreshCcw className="h-4 w-4" />
              再試行
            </button>
            <button type="button" className="button-link button-link--secondary" onClick={onSignOut}>
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </div>
        </div>
      ) : null}

      {status.kind === "ready" ? (
        <>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <div className="admin-shell__summary m-0 flex flex-wrap gap-x-4">
              <span>総件数: {totalCount}件</span>
              <span>
                {summary.latest
                  ? `最新: ${formatDateTime(summary.latest)}`
                  : "まだお問い合わせはありません"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--text-main)]">ステータス:</span>
              <select
                className="admin-input py-1 px-3"
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                style={{ width: "auto", minWidth: "120px" }}
              >
                <option value="unresolved">未対応・対応中</option>
                <option value="all">すべて</option>
                <option value="pending">未対応</option>
                <option value="in_progress">対応中</option>
                <option value="resolved">対応済</option>
              </select>
            </div>
          </div>

          <div className="card table-card">
            <table className="info-table admin-contact-table">
              <thead>
                <tr>
                  <th>受信日時</th>
                  <th>名前</th>
                  <th>メール</th>
                  <th>種別</th>
                  <th>ステータス</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {messages.length > 0 ? (
                  messages.map((item) => (
                    <tr
                      key={item.id}
                      className="admin-contact-table__row"
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/admin/contact/${item.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/admin/contact/${item.id}`);
                        }
                      }}
                    >
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{getCategoryLabel(item.category)}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <span className="admin-contact-table__action">詳細</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>条件に一致するお問い合わせはありません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                type="button"
                className="button-link button-link--secondary py-1 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                前へ
              </button>
              <span className="text-sm font-medium text-[var(--text-main)] mx-2">
                {page} / {totalPages} ページ
              </span>
              <button
                type="button"
                className="button-link button-link--secondary py-1 px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                次へ
              </button>
            </div>
          )}
        </>
      ) : null}

      {toast ? <div className={`admin-toast admin-toast--${toast.kind}`}>{toast.message}</div> : null}
    </AdminPageShell>
  );
}
