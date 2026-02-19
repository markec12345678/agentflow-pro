/**
 * CTA click tracking for Google Analytics.
 * Call when user clicks a conversion CTA (e.g. Start Free Trial).
 */
export function trackCTAClick(destination: string, cta = "start_free_trial") {
  if (typeof window === "undefined") return;
  const gtag = window.gtag;
  if (typeof gtag === "function") {
    gtag("event", "cta_click", { cta, destination });
  }
}
