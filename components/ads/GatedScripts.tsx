"use client";

import { useEffect } from "react";
import { useHumanGate } from "@/hooks/useHumanGate";
import { SITE } from "@/lib/site";

function injectScript(id: string, src: string, attrs: Record<string, string> = {}) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

/**
 * Loads the AdSense library and GA4 only after the human-interaction gate passes,
 * so automated traffic never generates ad requests or analytics hits (IVT protection).
 */
export default function GatedScripts() {
  const allowed = useHumanGate();

  useEffect(() => {
    if (!allowed) return;
    if (SITE.adsenseClient) {
      injectScript(
        "adsbygoogle-js",
        `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(SITE.adsenseClient)}`,
        { crossorigin: "anonymous" },
      );
    }
    if (SITE.gaMeasurementId && typeof window.gtag !== "function") {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        // gtag.js expects the `arguments` object, not an array.
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", SITE.gaMeasurementId, { anonymize_ip: true });
      injectScript("gtag-js", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(SITE.gaMeasurementId)}`);
    }
  }, [allowed]);

  return null;
}
