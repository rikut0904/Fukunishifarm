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

export default function ContactMessagesPanel({ token, onSignOut }: ContactMessagesPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const loadMessages = useCallback(async () => {
    setStatus({ kind: "loading" });

    try {
      const response = await fetchAdminContactCatalog(token);
      setMessages(response.messages);
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
  }, [onSignOut, token]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

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
          <div className="admin-shell__summary">
            <span>総件数 {summary.total}件</span>
            <span>{summary.latest ? `最新 ${formatDateTime(summary.latest)}` : "まだお問い合わせはありません"}</span>
          </div>

          <div className="card table-card">
            <table className="info-table admin-contact-table">
              <thead>
                <tr>
                  <th>受信日時</th>
                  <th>名前</th>
                  <th>メール</th>
                  <th>種別</th>
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
                      <td>
                        <span className="admin-contact-table__action">詳細</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>まだお問い合わせはありません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {toast ? <div className={`admin-toast admin-toast--${toast.kind}`}>{toast.message}</div> : null}
    </AdminPageShell>
  );
}
