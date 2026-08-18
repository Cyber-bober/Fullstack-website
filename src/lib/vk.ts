export function extractVkVideoUrl(raw: string): string {
  if (!raw) return "";

  const iframeMatch = raw.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) return iframeMatch[1];

  const urlMatch = raw.match(/https?:\/\/[^\s<>"']+/i);
  if (urlMatch) return urlMatch[0];

  return raw.trim();
}

export function isValidVkVideoUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    const isVk =
      host.includes("vk.com") || host.includes("vk.ru") || host.includes("vkvideo.ru");
    if (!isVk) return false;
    return (
      parsed.pathname.includes("video_ext.php") ||
      parsed.pathname.includes("/video") ||
      parsed.pathname.includes("/embed")
    );
  } catch {
    return false;
  }
}
