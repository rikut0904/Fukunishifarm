"use client";

import { ApiError, apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  token: string;
};

type SessionResponse = {
  user: {
    email: string;
  };
};

type Status =
  | { kind: "signed-out" }
  | { kind: "signing-in" }
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

function isAuthExpired(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export default function LoginConsole() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "signed-out" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRetrySession = async () => {
    const token = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
      setStatus({ kind: "signed-out" });
      return;
    }

    try {
      await fetchSession(token);
      router.replace("/admin");
    } catch (error) {
      if (isAuthExpired(error)) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        setStatus({ kind: "signed-out" });
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
        return;
      }

      try {
        await fetchSession(token);
        router.replace("/admin");
      } catch (error) {
        if (isAuthExpired(error)) {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          if (!cancelled) {
            setStatus({ kind: "signed-out" });
          }
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

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: "signing-in" });

    try {
      const response = await loginAdmin(email, password);
      window.localStorage.setItem(SESSION_STORAGE_KEY, response.token);
      setPassword("");
      router.replace("/admin");
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

  return (
    <section className="section admin-page">
      <div className="admin-login-shell">
        <div className="admin-login-head">
          <div className="grid gap-1">
            <p className="eyebrow">Login</p>
            <h1 className="section__title">ログイン</h1>
          </div>
        </div>

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
            disabled={status.kind === "signing-in"}
          >
            {status.kind === "signing-in" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            ログイン
          </button>

          {status.kind === "error" ? <p className="admin-error">{status.message}</p> : null}

          {status.kind === "error" ? (
            <button
              type="button"
              className="button-link button-link--secondary"
              onClick={() => void handleRetrySession()}
            >
              再試行
            </button>
          ) : null}
        </form>
      </div>
    </section>
  );
}
