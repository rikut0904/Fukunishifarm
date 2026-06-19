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

export async function submitContactMessage(input: ContactMessageInput) {
  return apiFetch<ContactMessageResponse>("/v1/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
