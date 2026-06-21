/**
 * Design Tokens - Seapedia Ecommerce
 * File ini berisi konstanta font, warna, dan style lainnya
 * yang dapat digunakan di seluruh file (JSX, CSS, Tailwind, dll).
 *
 * Cara pakai di Tailwind:
 *   - Warna  : bg-primary, text-secondary, border-accent, dll (lihat tailwind.config.js)
 *   - Font   : font-sans (default), font-display, font-mono
 *   - Shadow : shadow-card, shadow-elevated
 */

export const fontFamily = {
  // Font utama untuk seluruh aplikasi
  sans: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  // Font untuk heading / display
  display: "'Poppins', system-ui, sans-serif",
  // Font monospace (untuk kode / angka tabular)
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

export const fontSize = {
  xs: ["0.75rem", { lineHeight: "1rem" }],
  sm: ["0.875rem", { lineHeight: "1.25rem" }],
  base: ["1rem", { lineHeight: "1.5rem" }],
  lg: ["1.125rem", { lineHeight: "1.75rem" }],
  xl: ["1.25rem", { lineHeight: "1.75rem" }],
  "2xl": ["1.5rem", { lineHeight: "2rem" }],
  "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
  "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
  "5xl": ["3rem", { lineHeight: "1.2" }],
};

/**
 * Palette warna Seapedia (tema laut/kelautan).
 * Nama-nama ini sudah didaftarkan ke Tailwind via tailwind.config.js,
 * sehingga bisa dipakai dengan class seperti `bg-primary`, `text-deep`, dll.
 */
export const colors = {
  // Brand utama
  primary: "#0EA5A4", // teal laut
  "primary-light": "#5EEAD4",
  "primary-dark": "#0F766E",

  // Aksen sekunder
  secondary: "#0369A1", // biru laut dalam
  "secondary-light": "#38BDF8",
  "secondary-dark": "#075985",

  // Aksen pendukung
  accent: "#F59E0B", // warna hangat (CTA, badge)
  "accent-light": "#FBBF24",
  "accent-dark": "#B45309",

  // Warna netral
  deep: "#0F172A",
  ink: "#1E293B",
  muted: "#64748B",
  surface: "#F8FAFC",
  background: "#FFFFFF",
  border: "#E2E8F0",

  // Status / feedback
  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#0EA5E9",
};

export const boxShadow = {
  card: "0 1px 2px 0 rgb(15 23 42 / 0.06), 0 1px 3px 0 rgb(15 23 42 / 0.08)",
  elevated:
    "0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.08)",
};

const theme = {
  fontFamily,
  fontWeight,
  fontSize,
  colors,
  boxShadow,
};

export default theme;
