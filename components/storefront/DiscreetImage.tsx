"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface DiscreetImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
  discreet?: boolean;
  buttonClassName?: string;
  onRevealed?: () => void;
}

export default function DiscreetImage({ src, alt, sizes, className = "object-cover", preload = false, discreet = false, buttonClassName = "", onRevealed }: DiscreetImageProps) {
  const [confirmed, setConfirmed] = useState(!discreet);

  useEffect(() => {
    if (!discreet) return;
    setConfirmed(window.localStorage.getItem("charwin-adult-confirmed") === "true");
    const revealForBrowser = () => setConfirmed(true);
    window.addEventListener("charwin-adult-confirmed", revealForBrowser);
    return () => window.removeEventListener("charwin-adult-confirmed", revealForBrowser);
  }, [discreet]);

  const confirm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    window.localStorage.setItem("charwin-adult-confirmed", "true");
    window.dispatchEvent(new Event("charwin-adult-confirmed"));
    setConfirmed(true);
    onRevealed?.();
  };

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        preload={preload}
        sizes={sizes}
        className={`${className} ${discreet && !confirmed ? "scale-105 blur-xl" : ""}`}
      />
      {discreet && !confirmed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 p-3 text-center">
          <button
            onClick={confirm}
            className={`inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[#35115F] shadow-lg ${buttonClassName}`}
          >
            <Eye size={15} /> I’m 18+ — show image
          </button>
        </div>
      )}
    </>
  );
}
