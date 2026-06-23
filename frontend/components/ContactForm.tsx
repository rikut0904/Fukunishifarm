"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { submitContactMessage } from "@/lib/contact";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const INQUIRY_TYPES = [
  "ぶどう狩りについて",
  "料金について",
  "アクセスについて",
  "予約について",
  "その他",
];

function isValidEmailAddress(value: string) {
  const email = value.trim();
  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

    if (!isValidEmailAddress(email)) {
      setErrorMessage("メールアドレスの形式が正しくありません。");
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

      setSuccessMessage("お問い合わせを受け付けました。");
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
            className="contact-input"
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
            className="contact-input"
            type="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
            aria-invalid={errorMessage === "メールアドレスの形式が正しくありません。"}
            required
          />
        </label>
      </div>

      <div className="grid grid--2">
        <label className="contact-field">
          <span>お問い合わせ種別</span>
          <select className="contact-input" value={category} onChange={(event) => setCategory(event.target.value)}>
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
            className="contact-input"
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
          className="contact-textarea"
          rows={8}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="できるだけ具体的にご記載ください"
          required
        />
      </label>

      {successMessage ? (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6 my-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-green-900 text-base mb-1">{successMessage}</h3>
              <p className="text-sm text-green-700 leading-relaxed mb-3">
                お問い合わせいただきありがとうございます。内容を確認の上、メールにてご返信いたします。
              </p>
              {threadId && (
                <div className="bg-white border border-green-100 rounded-lg p-3 text-xs md:text-sm font-semibold flex items-center justify-between flex-wrap gap-2">
                  <span className="text-gray-600">返信・やり取り確認用URL:</span>
                  <Link href={`/contact/${threadId}`} className="text-green-700 hover:text-green-900 underline break-all">
                    /contact/{threadId}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 my-4 flex items-center gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 m-0">{errorMessage}</p>
        </div>
      ) : null}

      <div className="contact-form__footer">
        <button type="submit" className="button-link button-link--primary flex items-center gap-2" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              送信中...
            </>
          ) : (
            "送信する"
          )}
        </button>
      </div>
    </form>
  );
}
