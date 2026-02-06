import type { Monaco } from "@monaco-editor/react";

const toHex = (color: string, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallback;

  try {
    ctx.fillStyle = fallback;
    ctx.fillStyle = color;
  } catch {
    return fallback;
  }

  const normalized = ctx.fillStyle;
  const match =
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(normalized) ||
    /^rgb\((\d+) (\d+) (\d+)/i.exec(normalized);

  if (!match) return fallback;

  const [r, g, b] = match.slice(1, 4).map((value) => Number(value));
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const toHexPart = (value: number) => clamp(value).toString(16).padStart(2, "0");
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`;
};

const resolveCssVar = (variable: string, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  const temp = document.createElement("span");
  temp.style.color = `var(${variable}, ${fallback})`;
  document.body.appendChild(temp);
  const value = getComputedStyle(temp).color;
  temp.remove();
  return toHex(value || fallback, fallback);
};

const resolveBackground = (variable: string, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  const temp = document.createElement("span");
  temp.style.backgroundColor = `var(${variable}, ${fallback})`;
  document.body.appendChild(temp);
  const value = getComputedStyle(temp).backgroundColor;
  temp.remove();
  return toHex(value || fallback, fallback);
};

export function registerShadcnTheme(monaco: Monaco) {
  const isDark = document.documentElement.classList.contains("dark");
  const background = resolveBackground("--background", isDark ? "#0b0f14" : "#ffffff");
  const foreground = resolveCssVar("--foreground", isDark ? "#e6e6e6" : "#0f0f0f");
  const muted = resolveBackground("--muted", isDark ? "#1f242d" : "#f4f4f5");
  const mutedForeground = resolveCssVar("--muted-foreground", isDark ? "#9aa0a6" : "#6b7280");
  const accent = resolveBackground("--accent", isDark ? "#2a303b" : "#f1f5f9");
  const border = resolveCssVar("--border", isDark ? "#2b2f36" : "#e5e7eb");
  const ring = resolveCssVar("--ring", isDark ? "#70737a" : "#94a3b8");
  const primary = resolveCssVar("--primary", isDark ? "#e2e8f0" : "#111827");

  monaco.editor.defineTheme("shadcn", {
    base: isDark ? "vs-dark" : "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6b7280", fontStyle: "italic" },
      { token: "keyword", foreground: "7c3aed" },
      { token: "number", foreground: "f59e0b" },
      { token: "string", foreground: "10b981" },
      { token: "type.identifier", foreground: "eab308" },
      { token: "delimiter", foreground: "9ca3af" },
      { token: "identifier", foreground: "9ca3af" },
    ],
    colors: {
      "editor.background": background,
      "editor.foreground": foreground,
      "editorLineNumber.foreground": mutedForeground,
      "editorLineNumber.activeForeground": foreground,
      "editorCursor.foreground": primary,
      "editor.selectionBackground": accent,
      "editor.inactiveSelectionBackground": accent,
      "editor.lineHighlightBackground": muted,
      "editorIndentGuide.background": border,
      "editorIndentGuide.activeBackground": ring,
      "editorWidget.background": background,
      "editorWidget.foreground": foreground,
      "editorWidget.border": border,
      "editorSuggestWidget.background": background,
      "editorSuggestWidget.border": border,
      "editorSuggestWidget.foreground": foreground,
    },
  });
}
