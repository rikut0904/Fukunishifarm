import DOMPurify from "isomorphic-dompurify";

export function renderHtmlContent(content: string) {
  const normalized = content.replaceAll("\r\n", "\n").trim();
  if (!normalized) {
    return "";
  }

  return DOMPurify.sanitize(normalized);
}
