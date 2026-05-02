/**
 * Google Analytics 4 loader.
 * Set VITE_GA_MEASUREMENT_ID in env (e.g. G-XXXXXXX).
 */
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let initialized = false;

export function initAnalytics() {
  if (initialized || !GA_ID || typeof window === "undefined") return;
  initialized = true;

  const s1 = document.createElement("script");
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s1);

  const s2 = document.createElement("script");
  s2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${GA_ID}', { anonymize_ip: true });
  `;
  document.head.appendChild(s2);
}

export function trackPageview(path: string) {
  if (!GA_ID || typeof window === "undefined" || !(window as any).gtag) return;
  (window as any).gtag("event", "page_view", { page_path: path });
}

export function trackEvent(name: string, params?: Record<string, any>) {
  if (!GA_ID || typeof window === "undefined" || !(window as any).gtag) return;
  (window as any).gtag("event", name, params || {});
}