"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

type OtherUser = {
  id: string;
  name: string;
  age: number | null;
  religion: string | null;
  caste: string | null;
  location: string | null;
  photos: string[];
};

type InterestCardProps = {
  id: string;
  status: string;
  otherUser: OtherUser;
  variant: "received" | "sent" | "accepted";
  onAccepted?: (id: string) => void;
  onDeclined?: (id: string) => void;
};

const statusBadge: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-warning/10 text-warning" },
  ACCEPTED: { label: "Accepted", cls: "bg-success/10 text-success" },
  DECLINED: { label: "Declined", cls: "bg-error/10 text-error" },
};

export function InterestCard({ id, status, otherUser, variant, onAccepted, onDeclined }: InterestCardProps) {
  const [acting, setActing] = useState<"accept" | "decline" | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const router = useRouter();
  const photo = otherUser.photos[0] ?? null;

  const act = async (action: "ACCEPT" | "DECLINE") => {
    setActing(action === "ACCEPT" ? "accept" : "decline");
    const res = await fetch(`/api/interests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      action === "ACCEPT" ? onAccepted?.(id) : onDeclined?.(id);
    }
    setActing(null);
  };

  const startChat = async () => {
    setStartingChat(true);
    const res = await fetch("/api/chat/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: otherUser.id }),
    });
    if (res.ok) {
      const data = await res.json();
      const convId = String(data.conversation?._id ?? data.conversation?.id ?? "");
      router.push(convId ? `/chat?conv=${convId}` : "/chat");
    } else {
      setStartingChat(false);
    }
  };

  const badge = statusBadge[status];

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-2xl)] bg-white dark:bg-neutral-100 p-3 shadow-base border border-neutral-100 dark:border-neutral-200">
      {/* Avatar */}
      <Link href={`/profiles/${otherUser.id}`} className="shrink-0">
        {photo ? (
          <img
            src={photo}
            alt={otherUser.name}
            className="h-14 w-14 rounded-[var(--radius-lg)] object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-neutral-50 to-neutral-100">
            <User size={24} className="text-neutral-400" strokeWidth={1.5} />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link href={`/profiles/${otherUser.id}`}>
          <p className="font-semibold text-text-primary hover:text-primary transition-fast truncate">
            {otherUser.name}
          </p>
        </Link>
        <p className="text-xs text-text-secondary truncate">
          {[otherUser.age ? `${otherUser.age} yrs` : null, otherUser.religion, otherUser.location]
            .filter(Boolean)
            .join(" • ")}
        </p>

        {/* Sent tab: show status badge */}
        {variant === "sent" && badge && (
          <span className={`mt-1 inline-block rounded-[var(--radius-full)] px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-1.5">
        {variant === "received" && (
          <>
            <button
              onClick={() => act("ACCEPT")}
              disabled={acting !== null}
              className="rounded-[var(--radius-lg)] bg-success text-white px-3 py-1.5 text-xs font-semibold transition-fast hover:shadow-md disabled:opacity-50"
            >
              {acting === "accept" ? "..." : "Accept"}
            </button>
            <button
              onClick={() => act("DECLINE")}
              disabled={acting !== null}
              className="rounded-[var(--radius-lg)] border border-error/30 px-3 py-1.5 text-xs font-semibold text-error transition-fast hover:bg-error/5 disabled:opacity-50"
            >
              {acting === "decline" ? "..." : "Decline"}
            </button>
          </>
        )}

        {variant === "accepted" && (
          <button
            onClick={startChat}
            disabled={startingChat}
            className="rounded-[var(--radius-lg)] bg-primary text-white px-3 py-1.5 text-xs font-semibold transition-fast hover:shadow-md disabled:opacity-50"
          >
            {startingChat ? "..." : "Chat"}
          </button>
        )}
      </div>
    </div>
  );
}
