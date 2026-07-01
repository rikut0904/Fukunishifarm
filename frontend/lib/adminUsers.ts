import { apiFetch } from "@/lib/api";

export type AdminUser = {
  id: number;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserInvitationInput = {
  email: string;
  displayName: string;
};

export async function fetchAdminUsers(token: string) {
  return apiFetch<{ users?: AdminUser[] }>("/v1/admin/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function inviteAdminUser(token: string, input: AdminUserInvitationInput) {
  return apiFetch<{ user: AdminUser }>("/v1/admin/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}
