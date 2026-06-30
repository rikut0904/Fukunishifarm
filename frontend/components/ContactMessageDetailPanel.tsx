"use client";

import AdminPageShell from "@/components/AdminPageShell";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/datetime";
import {
  createAdminContactReply,
  fetchAdminContactMessage,
  getCategoryLabel,
  updateAdminContactStatus,
  type AdminContactMessageDetail,
  type AdminContactReply,
} from "@/lib/contact";
import { ArrowLeft, Loader2, LogOut, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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

function getSenderLabel(reply: AdminContactReply) {
  if (reply.senderType === "admin") {
    return reply.senderName || reply.senderEmail || "運営";
  }

  return reply.senderName || "お問い合わせ者";
}

export default function ContactMessageDetailPanel({ token, id, onSignOut }: ContactMessageDetailPanelProps) {
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [detail, setDetail] = useState<AdminContactMessageDetail | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const replyLoadingRef = useRef(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const loadMessage = useCallback(async () => {
    await Promise.resolve();
    const requestId = ++requestIdRef.current;
    setStatus({ kind: "loading" });

    try {
      const response = await fetchAdminContactMessage(token, id);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setDetail(response);
      setStatus({ kind: "ready" });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }
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

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      await updateAdminContactStatus(token, id, newStatus);
      setToast({ kind: "success", message: "ステータスを更新しました。" });
      await loadMessage();
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }
      setToast({ kind: "error", message: "ステータスの更新に失敗しました。" });
    } finally {
      setStatusUpdating(false);
    }
  }, [id, loadMessage, onSignOut, token]);

  const handleReply = useCallback(async () => {
    if (!detail) {
      return;
    }
    if (replyLoadingRef.current) {
      return;
    }

    const message = replyMessage.trim();
    if (!message) {
      setReplyError("返信内容を入力してください。");
      return;
    }

    replyLoadingRef.current = true;
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
      replyLoadingRef.current = false;
      setReplyLoading(false);
    }
  }, [detail, id, loadMessage, onSignOut, replyMessage, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMessage();
    return () => {
      requestIdRef.current += 1;
    };
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
            <span>
              <Link href={`/contact/${detail.message.threadId}`} className="admin-contact-detail__thread-link">
                スレッドURL
              </Link>
            </span>
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
              <div>
                <p className="admin-contact-detail__label">ステータス</p>
                <select
                  className="admin-input py-1 px-2 text-sm mt-1"
                  value={detail.message.status}
                  onChange={(e) => void handleStatusChange(e.target.value)}
                  disabled={statusUpdating}
                  style={{ width: "auto", minWidth: "120px" }}
                >
                  <option value="pending">未対応</option>
                  <option value="in_progress">対応中</option>
                  <option value="resolved">対応済</option>
                </select>
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
              className="contact-textarea admin-contact-reply__textarea"
              value={replyMessage}
              onChange={(event) => setReplyMessage(event.target.value)}
              placeholder="返信内容を入力してください"
              maxLength={65535}
              rows={6}
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
                  <div
                    key={reply.id}
                    className={`admin-contact-reply-item ${
                      reply.senderType === "admin"
                        ? "admin-contact-reply-item--admin"
                        : "admin-contact-reply-item--customer"
                    }`}
                  >
                    <div className="admin-contact-reply-item__meta">
                      <span className="flex items-center gap-2">
                        {reply.senderType === "admin" ? (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[var(--brand)] text-white">
                            運営
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-700">
                            お客様
                          </span>
                        )}
                        <span className="font-bold text-[var(--text-main)]">
                          {getSenderLabel(reply)}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500">{formatDateTime(reply.createdAt)}</span>
                    </div>
                    <p className="admin-contact-reply-item__body mt-2 leading-relaxed text-gray-800">
                      {reply.message}
                    </p>
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
