"use client";

import { ApiError, apiFetch, getDisplayErrorMessage } from "@/lib/api";
import type { AdminMenuItem } from "@/lib/adminMenu";
import AdminPageShell from "@/components/AdminPageShell";
import ContactMessagesPanel from "@/components/ContactMessagesPanel";
import GrapeCatalogEditor from "@/components/GrapeCatalogEditor";
import AdminUsersPanel from "@/components/AdminUsersPanel";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SessionResponse = {
  user: {
    id: number;
    email: string;
  };
};

type Status =
  | { kind: "loading" }
  | { kind: "authenticated"; token: string; currentUserId: number }
  | { kind: "error"; message: string }
  | { kind: "redirecting" };

type AdminConsoleProps = {
  mode?: "home" | "grape" | "users" | "contact";
  menuItems?: AdminMenuItem[];
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

export default function AdminConsole({ mode = "home", menuItems = [] }: AdminConsoleProps) {
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
      const session = await fetchSession(token);
      setStatus({ kind: "authenticated", token, currentUserId: session.user.id });
    } catch (error) {
      if (isAuthExpired(error)) {
        handleSignOut();
        return;
      }

      setStatus({
        kind: "error",
        message: getDisplayErrorMessage(error, "セッションを確認できませんでした。"),
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
        const session = await fetchSession(token);
        if (!cancelled) {
          setStatus({ kind: "authenticated", token, currentUserId: session.user.id });
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
            message: getDisplayErrorMessage(error, "セッションを確認できませんでした。"),
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
            {menuItems.map((item) => {
              const href = item.href.trim();
              const key = `${item.title}:${href || "disabled"}`;

              if (!href) {
                return (
                  <div key={key} className="admin-menu-card" aria-disabled="true">
                    <div className="admin-menu-card__head">
                      <h2 className="admin-menu-card__title">{item.title}</h2>
                      {item.badge ? <span className="admin-menu-card__badge">{item.badge}</span> : null}
                    </div>
                    <p className="admin-menu-card__description">{item.description}</p>
                    <span className="admin-menu-card__action">環境変数未設定</span>
                  </div>
                );
              }

              return (
                <Link key={key} href={href} className="admin-menu-card">
                  <div className="admin-menu-card__head">
                    <h2 className="admin-menu-card__title">{item.title}</h2>
                    {item.badge ? <span className="admin-menu-card__badge">{item.badge}</span> : null}
                  </div>
                  <p className="admin-menu-card__description">{item.description}</p>
                  <span className="admin-menu-card__action">開く</span>
                </Link>
              );
            })}
          </div>
        </div>
      </AdminPageShell>
    );
  }

  if (mode === "users") {
    return <AdminUsersPanel token={status.token} currentUserId={status.currentUserId} onSignOut={handleSignOut} />;
  }

  if (mode === "contact") {
    return <ContactMessagesPanel token={status.token} onSignOut={handleSignOut} />;
  }

  return <GrapeCatalogEditor token={status.token} onSignOut={handleSignOut} />;
}
