"use client";

import ContactMessageDetailPanel from "@/components/ContactMessageDetailPanel";
import { ApiError, apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageShell from "@/components/AdminPageShell";

type SessionResponse = {
  user: {
    email: string;
  };
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

type ContactMessageDetailRouteProps = {
  id: number;
};

export default function ContactMessageDetailRoute({ id }: ContactMessageDetailRouteProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const storedToken = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!storedToken) {
        router.replace("/login");
        return;
      }

      try {
        await fetchSession(storedToken);
        if (!cancelled) {
          setToken(storedToken);
          setLoading(false);
        }
      } catch (error) {
        if (isAuthExpired(error)) {
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          router.replace("/login");
          return;
        }

        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <AdminPageShell title="お問い合わせ詳細" lead="読み込み中..." variant="narrow">
        <div className="admin-login-state">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-strong)]" />
          <p className="m-0">読み込み中...</p>
        </div>
      </AdminPageShell>
    );
  }

  if (!token) {
    return (
      <AdminPageShell title="お問い合わせ詳細" lead="セッションを確認できませんでした。" variant="narrow">
        <div className="admin-login-state">
          <p className="admin-error">セッションの確認に失敗しました。</p>
        </div>
      </AdminPageShell>
    );
  }

  return <ContactMessageDetailPanel token={token} id={id} onSignOut={() => router.replace("/login")} />;
}
