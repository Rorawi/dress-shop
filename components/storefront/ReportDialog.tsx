"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";

const reasonOptions = [
  ["counterfeit", "Suspected counterfeit"],
  ["unsafe", "Unsafe or prohibited item"],
  ["misleading", "Misleading information"],
  ["inappropriate", "Inappropriate content"],
  ["other", "Something else"],
] as const;

export default function ReportDialog({ shopId, productId, subjectName, subjectType }: {
  shopId: string;
  productId?: string;
  subjectName: string;
  subjectType: "shop" | "product";
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shopId, productId, subjectType, reason, message }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not send your report.");
      setStatus("Thanks. Your report has been sent to the Charwin Stores team.");
      setReason("");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "We could not send your report.");
    } finally {
      setBusy(false);
    }
  };

  return <>
    <button type="button" onClick={() => { setOpen(true); setStatus(""); }} className="inline-flex items-center gap-2 text-xs font-medium text-[#625B68] underline decoration-[#D9D1E0] underline-offset-4 hover:text-[#55239A]"><Flag size={14} /> Report this {subjectType}</button>
    {open && <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="report-title" className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[.18em] text-[#8B5BC7]">Help keep the marketplace safe</p><h2 id="report-title" className="font-[family-name:var(--font-playfair)] text-2xl">Report {subjectName}</h2></div><button onClick={() => setOpen(false)} aria-label="Close report form" className="rounded-full p-2 hover:bg-[#F5F1F8]"><X size={20} /></button></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">What’s the issue?<select required value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#E6E0EB] bg-white px-4 py-3 text-sm outline-none focus:border-[#8B5BC7]"><option value="">Choose a reason</option>{reasonOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="block text-sm font-medium">More detail <span className="font-normal text-[#625B68]">(optional)</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1200} rows={3} className="mt-1.5 w-full resize-y rounded-xl border border-[#E6E0EB] px-4 py-3 text-sm outline-none focus:border-[#8B5BC7]" placeholder="Tell us a little more" /></label>
          {status && <p role="status" className="text-sm leading-5 text-[#625B68]">{status}</p>}
          <button type="submit" disabled={!reason || busy || status.startsWith("Thanks") } className="w-full rounded-full bg-[#55239A] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#35115F] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Sending…" : status.startsWith("Thanks") ? "Report sent" : "Send report"}</button>
        </form>
      </section>
    </div>}
  </>;
}
