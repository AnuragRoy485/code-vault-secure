export const LANGUAGES = [
  { value: "plaintext", label: "Plain text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "tsx", label: "TSX / JSX" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C / C++" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash / Shell" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "markdown", label: "Markdown" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "xml", label: "XML" },
] as const;

export const EXPIRATIONS = [
  { value: "never", label: "Never", requiresAuth: true },
  { value: "10m", label: "10 minutes", requiresAuth: false },
  { value: "1h", label: "1 hour", requiresAuth: false },
  { value: "1d", label: "1 day", requiresAuth: false },
  { value: "1w", label: "1 week", requiresAuth: false },
  { value: "1mo", label: "1 month", requiresAuth: false },
  { value: "6mo", label: "6 months", requiresAuth: true },
  { value: "1y", label: "1 year", requiresAuth: true },
] as const;

export const VISIBILITIES = [
  { value: "public", label: "Public", description: "Listed in search, anyone can discover it." },
  { value: "unlisted", label: "Unlisted", description: "Hidden from search, anyone with the link can view." },
  { value: "private", label: "Private", description: "Only you can view. Requires sign-in.", requiresAuth: true },
] as const;

export type Visibility = "public" | "unlisted" | "private";

export const ANON_MAX_CHARS = 100_000;
export const AUTH_MAX_CHARS = 1_000_000;

export function expirationToDate(v: string): string | null {
  const now = Date.now();
  const map: Record<string, number> = {
    "10m": 10 * 60_000,
    "1h": 60 * 60_000,
    "1d": 24 * 60 * 60_000,
    "1w": 7 * 24 * 60 * 60_000,
    "1mo": 30 * 24 * 60 * 60_000,
    "6mo": 182 * 24 * 60 * 60_000,
    "1y": 365 * 24 * 60 * 60_000,
  };
  const ms = map[v];
  if (!ms) return null;
  return new Date(now + ms).toISOString();
}
