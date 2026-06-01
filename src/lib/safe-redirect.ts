/** Paths that should land on the app home (dashboard at `/`). */
const ALIASES: Record<string, string> = {
  "/homepage": "/",
  "/home": "/",
};

/**
 * Safe post-login redirect target. Blocks open redirects and unknown aliases.
 */
export function safeRedirectPath(from: string | null | undefined): string {
  if (!from || typeof from !== "string") return "/";

  let path = from.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes(":")) {
    return "/";
  }

  path = path.split("?")[0]?.split("#")[0] ?? path;
  if (path.length > 200) return "/";

  return ALIASES[path] ?? path;
}
