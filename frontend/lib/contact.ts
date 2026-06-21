import { apiFetch } from "@/lib/api";

export type ContactMessageInput = {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
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
  createdAt: string;
};

export type AdminContactCatalog = {
  messages: AdminContactMessage[];
};

export type AdminContactMessageDetail = {
  message: AdminContactMessage;
  replies: AdminContactReply[];
};

export type AdminContactReplyInput = {
  message: string;
};

export async function submitContactMessage(input: ContactMessageInput) {
  return apiFetch<ContactMessageResponse>("/v1/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchAdminContactCatalog(token: string) {
  return apiFetch<AdminContactCatalog>("/v1/admin/contact", {
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
