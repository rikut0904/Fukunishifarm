"use client";

import AdminPageShell from "@/components/AdminPageShell";
import { ApiError } from "@/lib/api";
import { type AdminUser, fetchAdminUsers, inviteAdminUser, resendAdminUserInvitation } from "@/lib/adminUsers";
import { formatDateTime } from "@/lib/datetime";
import { Loader2, RefreshCcw, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

type Toast = {
  kind: "success" | "error";
  message: string;
};

type AdminUsersPanelProps = {
  token: string;
  onSignOut: () => void;
};

type TabKey = "invite" | "list";

type InviteForm = {
  email: string;
  displayName: string;
};

const initialForm: InviteForm = {
  email: "",
  displayName: "",
};

function isAuthExpired(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function getLatestCreatedAt(users: AdminUser[]) {
  return users[0]?.createdAt ?? null;
}

function getRoleLabel(role: string) {
  if (role === "admin") {
    return "管理者";
  }

  return role || "-";
}

export default function AdminUsersPanel({ token, onSignOut }: AdminUsersPanelProps) {
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<InviteForm>(initialForm);
  const [toast, setToast] = useState<Toast | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("invite");
  const [resendingUserId, setResendingUserId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setStatus({ kind: "loading" });

    try {
      const payload = await fetchAdminUsers(token);
      if (requestId !== requestIdRef.current) {
        return;
      }

      setUsers(Array.isArray(payload.users) ? payload.users : []);
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
        message: error instanceof Error ? error.message : "管理者ユーザーを読み込めませんでした。",
      });
    }
  }, [onSignOut, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadUsers]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = form.email.trim();
    const displayName = form.displayName.trim();
    if (!email) {
      setToast({ kind: "error", message: "メールアドレスは必須です。" });
      return;
    }

    setStatus({ kind: "submitting" });

    try {
      const payload = await inviteAdminUser(token, {
        email,
        displayName,
      });

      setUsers((current) => [payload.user, ...current.filter((item) => item.id !== payload.user.id)]);
      setForm(initialForm);
      setStatus({ kind: "ready" });
      setToast({ kind: "success", message: "招待メールを送信しました。" });
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      setStatus({ kind: "ready" });
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "管理者ユーザーを招待できませんでした。",
      });
    }
  };

  const handleResendInvitation = async (user: AdminUser) => {
    setResendingUserId(user.id);

    try {
      await resendAdminUserInvitation(token, user.id);
      setToast({
        kind: "success",
        message: `${user.email} に招待メールを再送しました。`,
      });
    } catch (error) {
      if (isAuthExpired(error)) {
        onSignOut();
        return;
      }

      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "招待メールを再送できませんでした。",
      });
    } finally {
      setResendingUserId(null);
    }
  };

  return (
    <AdminPageShell
      title="ユーザー管理"
      actions={
        <button type="button" className="button-link button-link--secondary" onClick={() => void loadUsers()}>
          <RefreshCcw className="h-4 w-4" />
          再読み込み
        </button>
      }
    >
      <div className="admin-users-tabs" role="tablist" aria-label="ユーザー管理タブ">
        <button
          type="button"
          role="tab"
          id="admin-users-tab-invite"
          aria-controls="admin-users-panel-invite"
          aria-selected={activeTab === "invite"}
          className={`admin-users-tabs__tab ${activeTab === "invite" ? "admin-users-tabs__tab--active" : ""}`}
          onClick={() => setActiveTab("invite")}
        >
          管理者を招待
        </button>
        <button
          type="button"
          role="tab"
          id="admin-users-tab-list"
          aria-controls="admin-users-panel-list"
          aria-selected={activeTab === "list"}
          className={`admin-users-tabs__tab ${activeTab === "list" ? "admin-users-tabs__tab--active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          管理者を表示
        </button>
      </div>

      {activeTab === "invite" ? (
        <section className="admin-editor-section" role="tabpanel" id="admin-users-panel-invite" aria-labelledby="admin-users-tab-invite">
          <div className="admin-editor-item">
            <div className="admin-editor-item__head">
              <div>
                <h2 className="admin-editor-item__title">管理者を招待</h2>
              </div>
            </div>

            <form className="admin-users-form" onSubmit={handleSubmit}>
              <label className="admin-field">
                <span>表示名</span>
                <input
                  className="admin-input"
                  type="text"
                  value={form.displayName}
                  onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  placeholder="例: 山田 太郎"
                />
              </label>

              <label className="admin-field">
                <span>メールアドレス</span>
                <input
                  className="admin-input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="admin@example.com"
                  required
                />
              </label>
              <div className="admin-users-form__actions">
                <button type="submit" className="button-link button-link--primary" disabled={status.kind === "submitting"}>
                  {status.kind === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  招待メールを送信
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      {activeTab === "list" ? (
        <section className="admin-editor-section" role="tabpanel" id="admin-users-panel-list" aria-labelledby="admin-users-tab-list">
          <div className="admin-editor-item">
            <div className="admin-editor-item__head">
              <div>
                <h2 className="admin-editor-item__title">管理者一覧</h2>
              </div>
            </div>

            {status.kind === "loading" ? (
              <div className="admin-login-state">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-strong)]" />
                <p className="m-0">読み込み中...</p>
              </div>
            ) : null}

            {status.kind === "error" ? (
              <div className="admin-error-panel">
                <p className="admin-error">{status.message}</p>
              </div>
            ) : null}

            {status.kind !== "loading" && status.kind !== "error" ? (
              <div className="card table-card">
                <table className="info-table admin-users-table">
                  <thead>
                    <tr>
                      <th>表示名</th>
                      <th>メールアドレス</th>
                      <th>最終ログイン</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="admin-users-table__identity">
                              <span className="admin-users-table__name">{user.displayName || "未設定"}</span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{formatDateTime(user.lastLoginAt) || "-"}</td>
                          <td>
                            <button
                              type="button"
                              className="admin-users-table__action"
                              onClick={() => void handleResendInvitation(user)}
                              disabled={resendingUserId === user.id}
                            >
                              {resendingUserId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              再送
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>管理者ユーザーはまだ登録されていません。</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {toast ? <div className={`admin-toast admin-toast--${toast.kind}`}>{toast.message}</div> : null}
    </AdminPageShell>
  );
}
