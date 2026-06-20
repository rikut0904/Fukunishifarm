"use client";

import AdminPageShell from "@/components/AdminPageShell";
import { ApiError } from "@/lib/api";
import {
  createAdminContactReply,
  fetchAdminContactMessage,
  type AdminContactMessageDetail,
  type AdminContactReply,
} from "@/lib/contact";
import { ArrowLeft, Loader2, LogOut, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

type Toast = {
  kind: "success" | "error";
  message: string;
};

type ContactMessageDetailPanelProps = {
  token: string;
  id: number;
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

function getSenderLabel(reply: AdminContactReply) {
  if (reply.senderType === "admin") {
    return reply.senderName || reply.senderEmail || "運営";
  }

  return reply.senderName || "お問い合わせ者";
}

export default function ContactMessageDetailPanel({ token, id, onSignOut }: ContactMessageDetailPanelProps) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [detail, setDetail] = useState<AdminContactMessageDetail | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const loadMessage = useCallback(async () => {
    setStatus({ kind: "loading" });

    try {
      const response = await fetchAdminContactMessage(token, id);
      setDetail(response);
      setStatus({ kind: "ready" });
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "お問い合わせ詳細を読み込めませんでした。",
      });
    }
  }, [id, onSignOut, token]);

  const handleReply = useCallback(async () => {
    if (!detail) {
      return;
    }

    const message = replyMessage.trim();
    if (!message) {
      setReplyError("返信内容を入力してください。");
      return;
    }

    setReplyLoading(true);
    setReplyError(null);

    try {
      await createAdminContactReply(token, id, { message });
      setReplyMessage("");
      setToast({ kind: "success", message: "返信を送信しました。" });
      await loadMessage();
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      setReplyError(error instanceof Error ? error.message : "返信の送信に失敗しました。");
      setToast({ kind: "error", message: "返信の送信に失敗しました。" });
    } finally {
      setReplyLoading(false);
    }
  }, [detail, id, loadMessage, onSignOut, replyMessage, token]);

  useEffect(() => {
    void loadMessage();
  }, [loadMessage]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <AdminPageShell
      title="お問い合わせ詳細"
      lead="実際に送信されたお問い合わせの内容と返信履歴を確認できます。"
      actions={
        <Link href="/admin/contact" className="button-link button-link--secondary">
          <ArrowLeft className="h-4 w-4" />
          一覧へ戻る
        </Link>
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
            <button type="button" className="button-link button-link--primary" onClick={() => void loadMessage()}>
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

      {status.kind === "ready" && detail ? (
        <div className="admin-contact-detail">
          <div className="admin-contact-detail__summary">
            <span>{formatDateTime(detail.message.createdAt)}</span>
            <span>{getCategoryLabel(detail.message.category)}</span>
          </div>

          <div className="card card__body">
            <div className="admin-contact-detail__grid">
              <div>
                <p className="admin-contact-detail__label">お名前</p>
                <p className="admin-contact-detail__value">{detail.message.name}</p>
              </div>
              <div>
                <p className="admin-contact-detail__label">メールアドレス</p>
                <p className="admin-contact-detail__value">{detail.message.email}</p>
              </div>
              <div>
                <p className="admin-contact-detail__label">種別</p>
                <p className="admin-contact-detail__value">{getCategoryLabel(detail.message.category)}</p>
              </div>
              <div>
                <p className="admin-contact-detail__label">受信日時</p>
                <p className="admin-contact-detail__value">{formatDateTime(detail.message.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="card card__body">
            <p className="admin-contact-detail__label">件名</p>
            <p className="admin-contact-detail__value">{detail.message.subject}</p>
          </div>

          <div className="card card__body">
            <p className="admin-contact-detail__label">内容</p>
            <p className="admin-contact-detail__message">{detail.message.message}</p>
          </div>

          <div className="card card__body admin-contact-reply">
            <p className="admin-contact-detail__label">返信</p>
            <textarea
              className="admin-textarea admin-contact-reply__textarea"
              value={replyMessage}
              onChange={(event) => setReplyMessage(event.target.value)}
              placeholder="返信内容を入力してください"
            />
            {replyError ? <p className="admin-error">{replyError}</p> : null}
            <div className="admin-contact-reply__actions">
              <button type="button" className="button-link button-link--primary" onClick={() => void handleReply()} disabled={replyLoading}>
                {replyLoading ? "送信中..." : "返信を送信"}
              </button>
            </div>
          </div>

          <div className="card card__body admin-contact-replies">
            <p className="admin-contact-detail__label">返信履歴</p>
            {detail.replies.length > 0 ? (
              <div className="admin-contact-replies__list">
                {detail.replies.map((reply) => (
                  <div key={reply.id} className="admin-contact-reply-item">
                    <div className="admin-contact-reply-item__meta">
                      <span>{getSenderLabel(reply)}</span>
                      <span>{formatDateTime(reply.createdAt)}</span>
                    </div>
                    <p className="admin-contact-reply-item__body">{reply.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="note">まだ返信はありません。</p>
            )}
          </div>
        </div>
      ) : null}

      {toast ? <div className={`admin-toast admin-toast--${toast.kind}`}>{toast.message}</div> : null}
    </AdminPageShell>
  );
}
