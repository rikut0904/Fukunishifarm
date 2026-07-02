import { apiFetch } from "@/lib/api";

export type ContactMessageInput = {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  website?: string;
  submittedAt?: number;
};

export type ContactMessageResponse = {
  message: {
    id: number;
    threadId: string;
    createdAt: string;
  };
};

export type AdminContactMessage = {
  id: number;
  threadId: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export type AdminContactReply = {
  id: number;
  messageId: number;
  threadId: string;
  senderType: string;
  senderName: string;
  senderEmail: string;
  message: string;
  status: string;
  createdAt: string;
};

export type AdminContactCatalog = {
  messages: AdminContactMessage[];
  total: number;
  page: number;
  limit: number;
};

export type AdminContactMessageDetail = {
  message: AdminContactMessage;
  replies: AdminContactReply[];
};

export type AdminContactReplyInput = {
  message: string;
};

const contactCategoryLabels: Record<string, string> = {
  grape: "ぶどう狩りについて",
  reservation: "予約について",
  price: "料金について",
  access: "アクセスについて",
  other: "その他",
  general: "一般",
  "ぶどう狩りについて": "ぶどう狩りについて",
  "予約について": "予約について",
  "料金について": "料金について",
  "アクセスについて": "アクセスについて",
  "その他": "その他",
};

export function getCategoryLabel(category: string) {
  return contactCategoryLabels[category] ?? category;
}

export async function submitContactMessage(input: ContactMessageInput) {
  return apiFetch<ContactMessageResponse>("/v1/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchAdminContactCatalog(
  token: string,
  status: string = "unresolved",
  page: number = 1,
  limit: number = 10
) {
  const params = new URLSearchParams();
  if (status) {
    params.set("status", status);
  }
  if (page) {
    params.set("page", String(page));
  }
  if (limit) {
    params.set("limit", String(limit));
  }
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return apiFetch<AdminContactCatalog>(`/v1/admin/contact${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchAdminContactMessage(token: string, id: number) {
  return apiFetch<AdminContactMessageDetail>(`/v1/admin/contact/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createAdminContactReply(token: string, id: number, input: AdminContactReplyInput) {
  return apiFetch<{ reply: AdminContactReply }>(`/v1/admin/contact/${id}/replies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

export async function updateAdminContactStatus(token: string, id: number, status: string) {
  return apiFetch<{ success: boolean }>(`/v1/admin/contact/${id}/status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export type PublicContactThread = {
  message: AdminContactMessage;
  replies: AdminContactReply[];
};

export async function fetchPublicContactThread(threadId: string) {
  return apiFetch<PublicContactThread>(`/v1/contact/${threadId}`);
}

export async function createPublicContactReply(threadId: string, input: AdminContactReplyInput) {
  return apiFetch<{ reply: AdminContactReply }>(`/v1/contact/${threadId}/replies`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
