"use client";

import { useEffect } from "react";

export default function ActionErrorRecovery() {
  useEffect(() => {
    const isStaleAction = (msg: unknown) => {
      const str = String(msg || "");
      return (
        str.includes("Server Action") &&
        (str.includes("was not found") || str.includes("Failed to find") || str.includes("UnrecognizedActionError"))
      );
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || event.reason;
      if (isStaleAction(msg)) {
        event.preventDefault();
        window.location.reload();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (isStaleAction(event.message) || isStaleAction(event.error?.message)) {
        event.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
