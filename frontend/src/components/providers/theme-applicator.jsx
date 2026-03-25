import { useEffect } from "react";
import { useGetSettingsQuery } from "@/redux/features/cmsApi";

// Darken a hex color by a given percentage (0-100)
function darkenHex(hex, percent) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - Math.round(((n >> 16) * percent) / 100));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round((((n >> 8) & 0xff) * percent) / 100));
  const b = Math.max(0, (n & 0xff) - Math.round(((n & 0xff) * percent) / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Reads SiteSettings from the CRM and injects theme colors as CSS custom
 * properties on <html>. Runs client-side only so SSR is unaffected.
 *
 * CRM Theme Settings → CSS variables mapping:
 *   primaryColor   → --cl-primary  (orange accent)
 *   secondaryColor → --cl-secondary (blue)
 *   accentColor    → --cl-accent
 *   headerBg       → --cl-header-bg (nav bar background)
 */
const ThemeApplicator = () => {
  const { data } = useGetSettingsQuery();

  useEffect(() => {
    const theme = data?.data?.theme;
    if (!theme || typeof window === "undefined") return;

    const root = document.documentElement;
    if (theme.primaryColor) {
      root.style.setProperty("--cl-primary", theme.primaryColor);
      root.style.setProperty("--cl-primary-hover", darkenHex(theme.primaryColor, 10));
    }
    if (theme.secondaryColor) {
      root.style.setProperty("--cl-secondary", theme.secondaryColor);
    }
    if (theme.accentColor) {
      root.style.setProperty("--cl-accent", theme.accentColor);
    }
    if (theme.headerBg) {
      root.style.setProperty("--cl-header-bg", theme.headerBg);
    }
  }, [data]);

  return null;
};

export default ThemeApplicator;
