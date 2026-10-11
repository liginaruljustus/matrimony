import { CheckCircle, XCircle, Minus } from "lucide-react";

export type EmailEntry = { status?: string; at?: string; to?: string; error?: string | null } | null | undefined;
export type EmailLog = { credentials?: EmailEntry; profileLive?: EmailEntry } | null | undefined;

const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

/** One email's delivery state: Sent / Failed / no record. */
export function EmailBadge({ label, entry, notDue }: { label: string; entry: EmailEntry; notDue?: boolean }) {
  if (entry?.status === "SENT") {
    return (
      <span
        title={`${label}: sent ${fmt(entry.at)}${entry.to ? ` to ${entry.to}` : ""}`}
        className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-green-200"
      >
        <CheckCircle size={11} /> {label}
      </span>
    );
  }
  if (entry?.status === "FAILED") {
    return (
      <span
        title={`${label}: FAILED ${fmt(entry.at)} — ${entry.error ?? "unknown error"}`}
        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200"
      >
        <XCircle size={11} /> {label}
      </span>
    );
  }
  return (
    <span
      title={notDue ? `${label}: not due yet` : `${label}: no record of this email being sent`}
      className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-400 ring-1 ring-slate-200"
    >
      <Minus size={11} /> {label}
    </span>
  );
}

/** Both automatic emails for a user, side by side (used in the Users table). */
export function EmailStatusPair({ log, profileLive }: { log: EmailLog; profileLive: boolean }) {
  return (
    <span className="flex flex-wrap gap-1">
      <EmailBadge label="Login" entry={log?.credentials} />
      <EmailBadge label="Profile" entry={log?.profileLive} notDue={!profileLive} />
    </span>
  );
}
