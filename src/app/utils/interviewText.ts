export function fixEncoding(text: string): string {
  try {
    return decodeURIComponent(escape(text));
  } catch {
    return text;
  }
}

export function sanitizeInterviewText(text: string): string {
  return fixEncoding(text);
}
