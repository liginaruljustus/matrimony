"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone, MessageCircle, Mail, User, Copy,
  CheckCircle, AlertCircle, CreditCard,
} from "lucide-react";
type Contact = {
  favoriteId: string;
  favoriteUserId: string;
  secondPaidAt: string;
  name: string;
  profileId: string;
  photo: string | null;
  cdCard: {
    profileId: string;
    contactPersonName?: string;
    contactNumber?: string;
    whatsappNo?: string;
    email?: string;
  } | null;
};

export default function ContactDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [pending, setPending]     = useState(0);
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/contact-details");
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setPending(data.pendingApproval ?? 0);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") load();
  }, [status, load, router]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  return (
    <div className="bg-[#faf7f2] dark:bg-neutral-100 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[#7a1f2b]">
          <CreditCard size={22} />
          Contact Details
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Contact information for brides you&apos;ve unlocked
        </p>
      </div>

      {/* Pending notice */}
      {pending > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {pending} payment{pending > 1 ? "s" : ""} pending admin approval
            </p>
            <p className="text-xs text-amber-700">Contact details will appear here once verified.</p>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Phone size={52} className="mb-4 text-neutral-200" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-neutral-600">No Contact Details Yet</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Complete 2nd payment for profiles in your Inbox to unlock contact details.
          </p>
          <Link
            href="/inbox"
            className="mt-5 rounded-lg bg-[#7a1f2b] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors"
          >
            Go to Inbox
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {contacts.map((contact) => {
            const cd = contact.cdCard;
            return (
              <div
                key={contact.favoriteId}
                className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-200 bg-white dark:bg-neutral-100 shadow-sm"
              >
                {/* Top strip */}
                <div className="flex items-center gap-4 bg-gradient-to-r from-[#7a1f2b]/5 to-[#d4af37]/5 p-4">
                  {contact.photo ? (
                    <img
                      src={contact.photo}
                      alt={contact.name}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7a1f2b]/20 text-xl font-bold text-[#7a1f2b] ring-2 ring-white">
                      {contact.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-900">{contact.name}</h3>
                    <p className="font-mono text-xs text-neutral-400">{contact.profileId}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-green-700 font-semibold">
                      <CheckCircle size={10} />
                      Unlocked on {new Date(contact.secondPaidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Contact rows */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-200 p-4">
                  {cd?.contactPersonName && (
                    <ContactRow
                      icon={<User size={15} className="text-[#7a1f2b]" />}
                      label="Contact Person"
                      value={cd.contactPersonName}
                    />
                  )}
                  {cd?.contactNumber && (
                    <ContactRow
                      icon={<Phone size={15} className="text-[#7a1f2b]" />}
                      label="Phone"
                      value={cd.contactNumber}
                      copyKey={`phone-${contact.favoriteId}`}
                      onCopy={() => copy(cd.contactNumber!, `phone-${contact.favoriteId}`)}
                      copied={copied === `phone-${contact.favoriteId}`}
                      href={`tel:${cd.contactNumber}`}
                    />
                  )}
                  {cd?.whatsappNo && (
                    <ContactRow
                      icon={<MessageCircle size={15} className="text-green-600" />}
                      label="WhatsApp"
                      value={cd.whatsappNo}
                      copyKey={`wa-${contact.favoriteId}`}
                      onCopy={() => copy(cd.whatsappNo!, `wa-${contact.favoriteId}`)}
                      copied={copied === `wa-${contact.favoriteId}`}
                      href={`https://wa.me/${cd.whatsappNo.replace(/\D/g, "")}`}
                      external
                    />
                  )}
                  {cd?.email && (
                    <ContactRow
                      icon={<Mail size={15} className="text-blue-600" />}
                      label="Email"
                      value={cd.email}
                      copyKey={`email-${contact.favoriteId}`}
                      onCopy={() => copy(cd.email!, `email-${contact.favoriteId}`)}
                      copied={copied === `email-${contact.favoriteId}`}
                      href={`mailto:${cd.email}`}
                    />
                  )}

                  {!cd?.contactNumber && !cd?.whatsappNo && !cd?.email && (
                    <p className="py-2 text-xs text-neutral-400 text-center">
                      Contact details not yet available
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

function ContactRow({
  icon, label, value, onCopy, copied, href, external = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
  copyKey?: string;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
          {href ? (
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="truncate text-sm font-semibold text-[#7a1f2b] hover:underline"
            >
              {value}
            </a>
          ) : (
            <p className="truncate text-sm font-semibold text-neutral-800">{value}</p>
          )}
        </div>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="ml-2 shrink-0 flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-200 px-2 py-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-200 transition-colors"
        >
          {copied ? <CheckCircle size={11} className="text-green-600" /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}
