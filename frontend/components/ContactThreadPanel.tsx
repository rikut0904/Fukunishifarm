"use client";

import { ApiError, getDisplayErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/datetime";
import { createPublicContactReply, fetchPublicContactThread, getCategoryLabel, type PublicContactThread } from "@/lib/contact";
import { ArrowLeft, Loader2, RefreshCcw, Send } from "lucide-react";
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

type ContactThreadPanelProps = {
  threadId: string;
  initialDetail?: PublicContactThread | null;
  initialErrorMessage?: string | null;
};

function isThreadNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

function getSenderLabel(reply: PublicContactThread["replies"][number]) {
  if (reply.senderType === "admin") {
    return reply.senderName || reply.senderEmail || "運営";
  }

  return reply.senderName || "お問い合わせ者";
}

export default function ContactThreadPanel({
  threadId,
  initialDetail = null,
  initialErrorMessage = null,
}: ContactThreadPanelProps) {
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState<Status>(
    initialDetail
      ? { kind: "ready" }
      : initialErrorMessage
        ? { kind: "error", message: initialErrorMessage }
        : { kind: "loading" }
  );
  const [detail, setDetail] = useState<PublicContactThread | null>(initialDetail);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const replyLoadingRef = useRef(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const loadThread = useCallback(async () => {
    await Promise.resolve();
    const requestId = ++requestIdRef.current;
    setStatus({ kind: "loading" });

    try {
      const response = await fetchPublicContactThread(threadId);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setDetail(response);
      setStatus({ kind: "ready" });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStatus({
        kind: "error",
        message: isThreadNotFound(error)
          ? "このスレッドは見つかりませんでした。"
          : getDisplayErrorMessage(error, "スレッドを読み込めませんでした。"),
      });
    }
  }, [threadId]);

  const handleReply = useCallback(async () => {
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
      await createPublicContactReply(threadId, { message });
      setReplyMessage("");
      setToast({ kind: "success", message: "返信を送信しました。" });
      await loadThread();
    } catch (error) {
      setReplyError(getDisplayErrorMessage(error, "返信の送信に失敗しました。"));
      setToast({ kind: "error", message: "返信の送信に失敗しました。" });
    } finally {
      replyLoadingRef.current = false;
      setReplyLoading(false);
    }
  }, [loadThread, replyMessage, threadId]);

  useEffect(() => {
    if (!initialDetail && !initialErrorMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadThread();
    }
    return () => {
      requestIdRef.current += 1;
    };
  }, [initialDetail, initialErrorMessage, loadThread]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <section className="section">
      <div className="section__head">
        <p className="eyebrow">Contact Thread</p>
        <h1 className="section__title">お問い合わせスレッド</h1>
        <div className="section__actions">
          <Link href="/contact" className="button-link button-link--secondary">
            <ArrowLeft className="h-4 w-4" />
            お問い合わせへ戻る
          </Link>
        </div>
      </div>

      {status.kind === "loading" ? (
        <div className="admin-login-state">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-strong)]" />
          <p className="m-0">読み込み中...</p>
        </div>
      ) : null}

      {status.kind === "error" ? (
        <div className="card card__body">
          <p className="admin-error">{status.message}</p>
          <div className="admin-error-panel__actions">
            <button type="button" className="button-link button-link--primary" onClick={() => void loadThread()}>
              <RefreshCcw className="h-4 w-4" />
              再試行
            </button>
          </div>
        </div>
      ) : null}

      {status.kind === "ready" && detail ? (
        <div className="contact-thread">
          <div className="card card__body contact-thread__summary">
            <div className="admin-shell__summary">
              <span>{formatDateTime(detail.message.createdAt)}</span>
              <span>{getCategoryLabel(detail.message.category)}</span>
            </div>
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
                <p className="admin-contact-detail__label">件名</p>
                <p className="admin-contact-detail__value">{detail.message.subject}</p>
              </div>
            </div>
          </div>

          <div className="card card__body">
            <p className="admin-contact-detail__label">お問い合わせ内容</p>
            <p className="admin-contact-detail__message">{detail.message.message}</p>
          </div>

          <div className="card card__body admin-contact-reply">
            <p className="admin-contact-detail__label">返信する</p>
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
                <Send className="h-4 w-4" />
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
    </section>
  );
}
