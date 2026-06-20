"use client";

import { ApiError, apiFetch } from "@/lib/api";
import { adminMenuItems } from "@/lib/adminMenu";
import AdminPageShell from "@/components/AdminPageShell";
import ContactMessagesPanel from "@/components/ContactMessagesPanel";
import GrapeCatalogEditor from "@/components/GrapeCatalogEditor";
import NewsCatalogEditor from "@/components/NewsCatalogEditor";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SessionResponse = {
  user: {
    email: string;
  };
};

type Status =
  | { kind: "loading" }
  | { kind: "authenticated"; token: string }
  | { kind: "error"; message: string }
  | { kind: "redirecting" };

type AdminConsoleProps = {
  mode?: "home" | "grape" | "news" | "users" | "contact";
};

const SESSION_STORAGE_KEY = "fukunishifarm.admin.session";

async function fetchSession(token: string) {
  return apiFetch<SessionResponse>("/v1/auth/session", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function isAuthExpired(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export default function AdminConsole({ mode = "home" }: AdminConsoleProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const handleSignOut = () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setStatus({ kind: "redirecting" });
    router.replace("/login");
  };

  const handleRetry = async () => {
    const token = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      await fetchSession(token);
      setStatus({ kind: "authenticated", token });
    } catch (error) {
      if (isAuthExpired(error)) {
        handleSignOut();
        return;
      }

      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "セッションを確認できませんでした。",
      });
    }
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const token = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await fetchSession(token);
        if (!cancelled) {
          setStatus({ kind: "authenticated", token });
        }
      } catch (error) {
        if (isAuthExpired(error)) {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          router.replace("/login");
          return;
        }

        if (!cancelled) {
          setStatus({
            kind: "error",
            message: error instanceof Error ? error.message : "セッションを確認できませんでした。",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status.kind === "loading" || status.kind === "redirecting") {
    return (
      <AdminPageShell title="管理画面" lead="読み込み中..." variant="narrow">
        <div className="admin-login-state">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-strong)]" />
          <p className="m-0">読み込み中...</p>
        </div>
      </AdminPageShell>
    );
  }

  if (status.kind === "error") {
    return (
      <AdminPageShell title="管理画面" lead="セッションの確認に失敗しました。" variant="narrow">
        <div className="admin-login-state">
          <p className="admin-error">{status.message}</p>
          <button type="button" className="button-link button-link--primary" onClick={() => void handleRetry()}>
            再試行
          </button>
          <button type="button" className="button-link button-link--secondary" onClick={handleSignOut}>
            ログアウト
          </button>
        </div>
      </AdminPageShell>
    );
  }

  if (mode === "home") {
    return (
      <AdminPageShell title="管理ページ" lead="編集したい項目を選んでください。">
        <div className="admin-home-panel">
          <div className="admin-menu">
            {adminMenuItems.map((item) => (
              <Link key={item.href} href={item.href} className="admin-menu-card">
                <div className="admin-menu-card__head">
                  <h2 className="admin-menu-card__title">{item.title}</h2>
                  {item.badge ? <span className="admin-menu-card__badge">{item.badge}</span> : null}
                </div>
                <p className="admin-menu-card__description">{item.description}</p>
                <span className="admin-menu-card__action">開く</span>
              </Link>
            ))}
          </div>
        </div>
      </AdminPageShell>
    );
  }

  if (mode === "users") {
    return (
      <AdminPageShell title="ユーザー管理" lead="準備中です。ここに管理者ユーザーの一覧や追加機能を実装できます。">
        <div className="admin-login-state">
          <p className="m-0">現在は閲覧用のプレースホルダです。操作メニューは上部ヘッダーから移動できます。</p>
        </div>
      </AdminPageShell>
    );
  }

  if (mode === "contact") {
    return <ContactMessagesPanel token={status.token} onSignOut={handleSignOut} />;
  }

  if (mode === "news") {
    return <NewsCatalogEditor token={status.token} onSignOut={handleSignOut} />;
  }

  return <GrapeCatalogEditor token={status.token} onSignOut={handleSignOut} />;
}
