"use client";

import { useEffect, useRef } from "react";
import { useHumanGate } from "@/hooks/useHumanGate";
import { SITE } from "@/lib/site";

export interface SafeAdSlotProps {
  slot: string;
  /** Reserved height prevents Cumulative Layout Shift when the ad fills in. */
  minHeight?: number;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  className?: string;
}

/**
 * Bot-protected, CLS-safe AdSense container. The `<ins>` is only rendered (and `adsbygoogle.push`
 * only called) after a verified human interaction with no automation signals.
 */
export default function SafeAdSlot({ slot, minHeight = 280, format = "auto", className }: SafeAdSlotProps) {
  const allowed = useHumanGate();
  const pushed = useRef(false);
  const enabled = allowed && Boolean(SITE.adsenseClient && slot);

  useEffect(() => {
    if (!enabled || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet or blocked by an extension: leave the reserved space empty.
    }
  }, [enabled]);

  if (!SITE.adsenseClient || !slot) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div className={className}>
        <div
          style={{ minHeight }}
          className="grid place-items-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400"
        >
          Espacio publicitario (configura NEXT_PUBLIC_ADSENSE_CLIENT y el slot)
        </div>
      </div>
    );
  }

  return (
    <aside aria-label="Publicidad" className={className}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-slate-400">Publicidad</p>
      <div style={{ minHeight }} className="overflow-hidden">
        {enabled && (
          <ins
            className="adsbygoogle"
            style={{ display: "block", minHeight }}
            data-ad-client={SITE.adsenseClient}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        )}
      </div>
    </aside>
  );
}
