"use client";

import { ApiError, apiFetch } from "@/lib/api";
import { Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SessionResponse = {
  user: {
    email: string;
  };
};

type Status =
  | { kind: "loading" }
  | { kind: "authenticated" }
  | { kind: "error"; message: string }
  | { kind: "redirecting" };

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

export default function AdminConsole() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const handleRetry = async () => {
    const token = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      await fetchSession(token);
      setStatus({ kind: "authenticated" });
    } catch (error) {
      if (isAuthExpired(error)) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        router.replace("/login");
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
          setStatus({ kind: "authenticated" });
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

  const handleSignOut = () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setStatus({ kind: "redirecting" });
    router.replace("/login");
  };

  if (status.kind === "loading" || status.kind === "redirecting") {
    return (
      <section className="section admin-page">
        <div className="admin-login-shell">
          <div className="admin-login-state">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-strong)]" />
            <p className="m-0">読み込み中...</p>
          </div>
        </div>
      </section>
    );
  }

  if (status.kind === "error") {
    return (
      <section className="section admin-page">
        <div className="admin-login-shell">
          <div className="admin-login-head">
            <div className="grid gap-1">
              <p className="eyebrow">Admin</p>
              <h1 className="section__title">管理画面</h1>
            </div>
          </div>

          <div className="admin-login-state">
            <p className="admin-error">{status.message}</p>
            <button type="button" className="button-link button-link--primary" onClick={() => void handleRetry()}>
              再試行
            </button>
            <button type="button" className="button-link button-link--secondary" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section admin-page">
      <div className="admin-login-shell">
        <div className="admin-login-head">
          <div className="grid gap-1">
            <p className="eyebrow">Admin</p>
            <h1 className="section__title">管理画面</h1>
          </div>
        </div>

        <div className="admin-login-state">
          <button type="button" className="button-link button-link--secondary" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </div>
      </div>
    </section>
  );
}
