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
    createdAt: string;
  };
};

export type AdminContactMessage = {
  id: number;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  createdAt: string;
};

export type AdminContactReply = {
  id: number;
  messageId: number;
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
