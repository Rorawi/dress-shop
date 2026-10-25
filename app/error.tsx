"use client";

import { useEffect } from "react";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = error?.message || "";
    // If a server action hash changed due to compilation or restart, auto-reload to fetch the current build
    if (
      msg.includes("Server Action") ||
      msg.includes("Failed to find Server Action") ||
      msg.includes("UnrecognizedActionError") ||
      error.name === "UnrecognizedActionError"
    ) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[#17141c]">Connection Updated</h2>
        <p className="mt-3 text-sm leading-6 text-[#625b68]">
          The application updated in the background. A quick reload will reconnect your session.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-[#55239a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#35115f]"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
