"use client";

import { useState, useEffect } from "react";
import { Lock, Send, CheckCircle, Clock } from "lucide-react";

export function RequestEditButton() {
  const [pending, setPending]     = useState<boolean | null>(null); // null = still checking
  const [open, setOpen]           = useState(false);
  const [text, setText]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [justSent, setJustSent]   = useState(false);

  useEffect(() => {
    fetch("/api/profile/edit-request")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setPending(!!d?.pending))
      .catch(() => setPending(false));
  }, []);

  const submit = async () => {
    if (!text.trim()) { setError("Please describe what you'd like to change."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res  = await fetch("/api/profile/edit-request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send request"); return; }
      setPending(true);
      setJustSent(true);
      setOpen(false);
      setText("");
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (pending === null) return null; // avoid flashing the wrong state while checking

  if (pending) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <Clock size={12} />
        {justSent ? "Request sent — " : ""}Waiting for admin to review your request
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
      >
        <Lock size={12} />
        Request Profile Edit
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-white p-3">
      <p className="mb-1.5 text-xs font-semibold text-neutral-700">
        What would you like to change?
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="e.g. I need to correct my date of birth and add a new photo"
        className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
      />
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-1 rounded-lg bg-[#7a1f2b] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#6b1823] disabled:opacity-60"
        >
          <Send size={11} />
          {submitting ? "Sending…" : "Send Request"}
        </button>
        <button
          onClick={() => { setOpen(false); setError(""); }}
          disabled={submitting}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
