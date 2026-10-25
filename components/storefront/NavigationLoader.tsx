"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop loader when navigation completes (pathname changes)
  useEffect(() => {
    if (loading) {
      setProgress(100);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => {
        setVisible(false);
        setLoading(false);
        setProgress(0);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Global link click interceptor
  useEffect(() => {
    const startLoading = () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      setVisible(true);
      setLoading(true);
      setProgress(15);
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 85;
          }
          return prev + Math.max(1, Math.floor((85 - prev) / 6));
        });
      }, 180);
    };

    const stopLoading = () => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setLoading(false);
        setProgress(0);
      }, 300);
    };

    const handleLinkClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest("a");
      if (!target?.href) return;
      try {
        const url = new URL(target.href, window.location.origin);
        const isInternal = url.origin === window.location.origin;
        const isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
        const isHashOnly = url.pathname === window.location.pathname && url.search === window.location.search && !!url.hash;
        const isSamePage = url.pathname === window.location.pathname && url.search === window.location.search && !url.hash;
        if (isInternal && !isModified && !isHashOnly && !isSamePage && !target.hasAttribute("download") && target.target !== "_blank") {
          startLoading();
        }
      } catch {
        // invalid URL, ignore
      }
    };

    window.addEventListener("click", handleLinkClick, { capture: true });
    window.addEventListener("charwin:loading:start", startLoading);
    window.addEventListener("charwin:loading:done", stopLoading);

    return () => {
      window.removeEventListener("click", handleLinkClick, { capture: true });
      window.removeEventListener("charwin:loading:start", startLoading);
      window.removeEventListener("charwin:loading:done", stopLoading);
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Top glowing progress bar */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="pointer-events-none fixed left-0 top-0 z-[99999] h-[3.5px] w-full bg-transparent"
      >
        <div
          className="h-full bg-gradient-to-r from-[#55239A] via-[#8B5BC7] to-[#D6C0F0] shadow-[0_0_12px_#8B5BC7,0_0_6px_#55239A]"
          style={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1,
            transition: progress === 100 ? "all 300ms ease-out" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Floating loading badge */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[99999] flex items-center gap-2.5 rounded-full border border-[#E6E0EB] bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#35115F] shadow-lg shadow-purple-950/10 backdrop-blur-md animate-in fade-in slide-in-from-top-2 sm:right-6 sm:top-5"
      >
        <Loader2 size={14} className="animate-spin text-[#55239A]" />
        <span>Loading…</span>
      </div>
    </>
  );
}
