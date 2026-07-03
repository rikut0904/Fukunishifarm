export function renderHtmlContent(content: string) {
  const normalized = content.replaceAll("\r\n", "\n").trim();
  if (!normalized) {
    return "";
  }

  return sanitizeHtml(normalized);
}

function sanitizeHtml(content: string) {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<(iframe|object|embed|link|meta)[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*data:text\/html[^'"]*\2/gi, "");
}

export function htmlToPlainText(content: string) {
  const normalized = content.replaceAll("\r\n", "\n").trim();
  if (!normalized) {
    return "";
  }

  return normalized
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlExcerpt(content: string, maxLength = 120) {
  const text = htmlToPlainText(content);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}
