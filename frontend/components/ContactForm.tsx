"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { submitContactMessage } from "@/lib/contact";

const INQUIRY_TYPES = [
  "ぶどう狩りについて",
  "料金について",
  "アクセスについて",
  "予約について",
  "その他",
];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(INQUIRY_TYPES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setThreadId(null);
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage("お名前、メールアドレス、件名、お問い合わせ内容を入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccessMessage(`お問い合わせを受け付けました。`);
      setThreadId(response.message.threadId);
      setName("");
      setEmail("");
      setCategory(INQUIRY_TYPES[0]);
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("failed to submit contact message", error);
      setErrorMessage("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="grid grid--2">
        <label className="contact-field">
          <span>お名前</span>
          <input
            className="admin-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例: 福西 太郎"
            autoComplete="name"
            required
          />
        </label>

        <label className="contact-field">
          <span>メールアドレス</span>
          <input
            className="admin-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
            required
          />
        </label>
      </div>

      <div className="grid grid--2">
        <label className="contact-field">
          <span>お問い合わせ種別</span>
          <select className="admin-input" value={category} onChange={(event) => setCategory(event.target.value)}>
            {INQUIRY_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="contact-field">
          <span>件名</span>
          <input
            className="admin-input"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="例: アクセス方法について"
            required
          />
        </label>
      </div>

      <label className="contact-field">
        <span>お問い合わせ内容</span>
        <textarea
          className="admin-textarea"
          rows={8}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="できるだけ具体的にご記載ください"
          required
        />
      </label>

      {successMessage ? <p className="text-sm text-green-700">{successMessage}</p> : null}
      {threadId ? (
        <p className="text-sm text-green-700">
          返信用URL: <Link href={`/contact/${threadId}`}>/contact/{threadId}</Link>
        </p>
      ) : null}
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="contact-form__footer">
        <button type="submit" className="button-link button-link--primary" disabled={isSubmitting}>
          {isSubmitting ? "送信中..." : "送信する"}
        </button>
      </div>
    </form>
  );
}
