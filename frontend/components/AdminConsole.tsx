"use client";

import { ApiError, apiFetch } from "@/lib/api";
import { Loader2, LogOut, Shield } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type LoginResponse = {
  token: string;
};

type SessionResponse = {
  user: {
    email: string;
  };
};

type Status =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "signing-in" }
  | { kind: "verifying" }
  | { kind: "authenticated" }
  | { kind: "error"; message: string };

const SESSION_STORAGE_KEY = "fukunishifarm.admin.session";

async function loginAdmin(email: string, password: string) {
  return apiFetch<LoginResponse>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

async function fetchSession(token: string) {
  return apiFetch<SessionResponse>("/v1/auth/session", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export default function AdminConsole() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
      setStatus({ kind: "signed-out" });
      return;
    }

    setSessionToken(token);
  }, []);

  useEffect(() => {
    if (!sessionToken) {
      return;
    }

    let cancelled = false;
    setStatus({ kind: "verifying" });

    fetchSession(sessionToken)
      .then(() => {
        if (!cancelled) {
          setStatus({ kind: "authenticated" });
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        setSessionToken(null);

        const message =
          error instanceof ApiError && error.status === 401
            ? "セッションが無効です。"
            : error instanceof Error
              ? error.message
              : "認証に失敗しました。";
        setStatus({ kind: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: "signing-in" });

    try {
      const response = await loginAdmin(email, password);
      window.localStorage.setItem(SESSION_STORAGE_KEY, response.token);
      setSessionToken(response.token);
      setPassword("");
      setStatus({ kind: "authenticated" });
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? "メールアドレスまたはパスワードが正しくありません。"
          : error instanceof Error
            ? error.message
            : "サインインできませんでした。";
      setStatus({ kind: "error", message });
    }
  };

  const handleSignOut = () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionToken(null);
    setStatus({ kind: "signed-out" });
  };

  return (
    <section className="section admin-page">
      <div className="admin-login-shell">
        <div className="admin-login-head">
          <p className="eyebrow">Restricted Access</p>
          <Shield className="h-5 w-5 text-[var(--brand-strong)]" />
        </div>
        <h1 className="section__title">管理者ログイン</h1>

        {status.kind === "authenticated" ? (
          <div className="admin-login-state">
            <p className="m-0">ログイン済みです。</p>
            <button type="button" className="button-link button-link--secondary" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </div>
        ) : (
          <form className="admin-login-form" onSubmit={handleSignIn}>
            <label className="admin-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="admin-input"
                autoComplete="email"
                placeholder="admin@example.com"
                required
              />
            </label>

            <label className="admin-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="admin-input"
                autoComplete="current-password"
                placeholder="password"
                required
              />
            </label>

            <button
              type="submit"
              className="button-link button-link--primary"
              disabled={status.kind === "signing-in" || status.kind === "verifying"}
            >
              {status.kind === "signing-in" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              ログイン
            </button>

            {status.kind === "error" ? <p className="admin-error">{status.message}</p> : null}
          </form>
        )}
      </div>
    </section>
  );
}
