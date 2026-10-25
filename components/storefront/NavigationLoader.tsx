"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop loader when navigation completes (pathname or searchParams changes)
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
  }, [pathname, searchParams]);

  // Global link click interceptor to start loading instantly on click
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest("a");
      if (!target || !target.href) return;

      const url = new URL(target.href, window.location.origin);
      const isInternal = url.origin === window.location.origin;
      const isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
      const isHashOnly = url.pathname === window.location.pathname && url.search === window.location.search && url.hash;
      const isSamePage = url.pathname === window.location.pathname && url.search === window.location.search && !url.hash;
      const isDownload = target.hasAttribute("download");
      const targetBlank = target.target === "_blank";

      if (isInternal && !isModified && !isHashOnly && !isSamePage && !isDownload && !targetBlank) {
        startLoading();
      }
    };

    const handleCustomStart = () => startLoading();
    const handleCustomStop = () => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setLoading(false);
        setProgress(0);
      }, 300);
    };

    window.addEventListener("click", handleLinkClick, { capture: true });
    window.addEventListener("charwin:loading:start", handleCustomStart);
    window.addEventListener("charwin:loading:done", handleCustomStop);

    return () => {
      window.removeEventListener("click", handleLinkClick, { capture: true });
      window.removeEventListener("charwin:loading:start", handleCustomStart);
      window.removeEventListener("charwin:loading:done", handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const startLoading = () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setVisible(true);
    setLoading(true);
    setProgress(15);

    // Smoothly advance progress bar while waiting
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        const step = Math.max(1, Math.floor((85 - prev) / 6));
        return prev + step;
      });
    }, 180);
  };

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
          className="h-full bg-gradient-to-r from-[#55239A] via-[#8B5BC7] to-[#D6C0F0] shadow-[0_0_12px_#8B5BC7,0_0_6px_#55239A] transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1,
            transition: progress === 100 ? "all 300ms ease-out" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Floating loading feedback badge in top-right */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[99999] flex items-center gap-2.5 rounded-full border border-[#E6E0EB] bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#35115F] shadow-lg shadow-purple-950/10 backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-2 sm:right-6 sm:top-5"
      >
        <Loader2 size={14} className="animate-spin text-[#55239A]" />
        <span>Loading…</span>
      </div>
    </>
  );
}
