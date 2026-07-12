"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

type Props = {
  html: string;
  className?: string;
};

export default function BlogHtmlContent({ html, className }: Props) {
  const sanitized = useMemo(() => {
    const normalized = html.replaceAll("\r\n", "\n").trim();
    if (!normalized) return "";
    return DOMPurify.sanitize(normalized);
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
