"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    const platform = navigator.userAgent.toLowerCase();
    setIos(/iphone|ipad|ipod/.test(platform) && !("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)));
    const beforeInstall = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    const appInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("appinstalled", appInstalled); };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  if (installed) return null;
  if (prompt) return <div className="fixed bottom-4 left-4 z-[60] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#e6e0eb] bg-white p-3 shadow-xl"><p className="px-2 text-xs text-[#625b68]">Add Charwin Stores to your home screen.</p><button onClick={install} className="mt-2 rounded-full bg-[#55239a] px-4 py-2 text-xs font-semibold text-white">Install app</button></div>;
  if (ios) return <div className="fixed bottom-4 left-4 z-[60] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#e6e0eb] bg-white p-3 shadow-xl"><button onClick={() => setShowIosHelp((visible) => !visible)} className="px-2 text-xs font-semibold text-[#55239a]">Add to Home Screen</button>{showIosHelp && <p className="mt-2 max-w-xs px-2 text-xs leading-5 text-[#625b68]">Open the Share menu in Safari, then choose “Add to Home Screen”.</p>}</div>;
  return null;
}
