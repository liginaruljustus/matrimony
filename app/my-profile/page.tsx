"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MatrimonyProfileForm } from "@/components/MatrimonyProfileForm";
import {
  User, MapPin, Briefcase, Users, Star,
  Phone, FileText, Pencil, ArrowLeft, Camera,
  CheckCircle, Clock, AlertCircle, XCircle, Flag,
} from "lucide-react";

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  APPROVED:         { label: "Approved",         color: "bg-green-100 text-green-800 border-green-200",  icon: <CheckCircle size={13} /> },
  PENDING_APPROVAL: { label: "Pending Approval",  color: "bg-amber-100 text-amber-800 border-amber-200",  icon: <Clock size={13} /> },
  DRAFT:            { label: "Draft",             color: "bg-neutral-100 text-neutral-600 border-neutral-200", icon: <FileText size={13} /> },
  REJECTED:         { label: "Rejected",          color: "bg-red-100 text-red-700 border-red-200",        icon: <XCircle size={13} /> },
  FLAGGED:          { label: "Flagged",           color: "bg-orange-100 text-orange-700 border-orange-200", icon: <Flag size={13} /> },
};

// ── Field row ─────────────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  let display: string;
  if (value === null || value === undefined || value === "") display = "—";
  else if (typeof value === "boolean") display = value ? "Yes" : "No";
  else display = String(value);

  return (
    <div className="flex items-start gap-2 py-2 border-b border-neutral-100 last:border-0">
      <span className="w-44 shrink-0 text-xs text-neutral-400">{label}</span>
      <span className="text-sm font-medium text-neutral-800">{display}</span>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700">
        <span className="text-[#7a1f2b]">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData]     = useState<any>(null);
  const [profile, setProfile]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    const load = async () => {
      try {
        const res  = await fetch("/api/user/profile");
        const data = await res.json();
        setUserData(data.user ?? null);
        setProfile(data.profile ?? null);
      } catch { /* silent */ }
      finally  { setLoading(false); }
    };
    void load();
  }, [status, router]);

  const handleSaved = async () => {
    // Re-fetch updated profile then switch back to view mode
    try {
      const res  = await fetch("/api/user/profile");
      const data = await res.json();
      setProfile(data.profile ?? null);
    } catch { /* silent */ }
    setEditing(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d4af37] border-t-[#7a1f2b]" />
      </div>
    );
  }

  // ── Edit mode ───────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          onClick={() => setEditing(false)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#7a1f2b] hover:underline"
        >
          <ArrowLeft size={15} />
          Back to Profile
        </button>
        <MatrimonyProfileForm
          defaultProfile={profile}
          onSaved={handleSaved}
        />
      </div>
    );
  }

  // ── View mode ───────────────────────────────────────────────────────────────
  const p = profile ?? {};
  const statusKey = p.profileStatus ?? "DRAFT";
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.DRAFT;

  const photos: string[] = Array.isArray(p.photos) ? p.photos : [];

  const fmt = (v: any) => (v !== undefined && v !== null && v !== "" ? String(v) : undefined);
  const fmtIncome = (v: any) => v != null && v !== "" ? `₹${Number(v).toLocaleString("en-IN")}/month` : undefined;
  const fmtHeight = (v: any) => v ? `${v} cm` : undefined;
  const fmtWeight = (v: any) => v ? `${v} kg` : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#7a1f2b]">My Profile</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {userData?.name ?? (session?.user as any)?.name ?? ""}
            {userData?.profileId && (
              <span className="ml-2 font-mono text-xs text-neutral-400">{userData.profileId}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 rounded-xl bg-[#7a1f2b] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#6b1823] transition-colors"
        >
          <Pencil size={14} />
          Edit Profile
        </button>
      </div>

      {/* Status badge */}
      <div className={`mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.color}`}>
        {statusCfg.icon}
        {statusCfg.label}
      </div>

      {/* Rejection reason */}
      {statusKey === "REJECTED" && p.rejectionReason && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Rejection reason: </span>{p.rejectionReason}
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 ? (
        <div className="mb-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700">
            <Camera size={15} className="text-[#7a1f2b]" />
            Photos
          </h2>
          <div className="flex flex-wrap gap-3">
            {photos.map((url, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl ${i === 0 ? "h-40 w-40" : "h-24 w-24"} border-2 ${i === 0 ? "border-[#7a1f2b]" : "border-neutral-200"}`}
              >
                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-md bg-[#7a1f2b]/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-6">
          <Camera size={22} className="text-neutral-300" />
          <div>
            <p className="text-sm font-semibold text-neutral-500">No photos uploaded</p>
            <p className="text-xs text-neutral-400">Click &ldquo;Edit Profile&rdquo; to add photos.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">

        {/* Personal Details */}
        <Section icon={<User size={15} />} title="Personal Details">
          <Field label="Age"              value={fmt(p.age)} />
          <Field label="Gender"           value={p.gender === "MALE" ? "Male" : p.gender === "FEMALE" ? "Female" : fmt(p.gender)} />
          <Field label="Date of Birth"    value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined} />
          <Field label="Marital Status"   value={fmt(p.maritalStatus)} />
          <Field label="Height"           value={fmtHeight(p.height)} />
          <Field label="Weight"           value={fmtWeight(p.weight)} />
          <Field label="Complexion"       value={fmt(p.complexion)} />
          <Field label="Religion"         value={fmt(p.religion)} />
          <Field label="Caste"            value={fmt(p.caste)} />
          <Field label="Sub-Caste"        value={fmt(p.subCaste)} />
          <Field label="Physically Challenged" value={p.physicallyChallenge != null ? p.physicallyChallenge : undefined} />
        </Section>

        {/* Location */}
        <Section icon={<MapPin size={15} />} title="Location">
          <Field label="Place of Birth"   value={fmt(p.placeOfBirth)} />
          <Field label="Time of Birth"    value={fmt(p.timeOfBirth)} />
          <Field label="Native District"  value={fmt(p.nativeDistrict)} />
          <Field label="Current Location" value={fmt(p.location)} />
          <Field label="Address"          value={fmt(p.address)} />
        </Section>

        {/* Education & Career */}
        <Section icon={<Briefcase size={15} />} title="Education & Career">
          <Field label="Education"        value={fmt(p.education)} />
          <Field label="Current Job"      value={fmt(p.currentJob)} />
          <Field label="Monthly Income"   value={fmtIncome(p.monthlyIncome ?? p.income)} />
        </Section>

        {/* Family Details */}
        <Section icon={<Users size={15} />} title="Family Details">
          <Field label="Father's Name"       value={fmt(p.fatherName)} />
          <Field label="Father's Occupation" value={fmt(p.fatherOccupation)} />
          <Field label="Mother's Name"       value={fmt(p.motherName)} />
          <Field label="Mother's Occupation" value={fmt(p.motherOccupation)} />
          <Field label="Brothers (Total)"    value={fmt(p.totalBrothers)} />
          <Field label="Brothers (Married)"  value={fmt(p.marriedBrothers)} />
          <Field label="Sisters (Total)"     value={fmt(p.totalSisters)} />
          <Field label="Sisters (Married)"   value={fmt(p.marriedSisters)} />
          <Field label="House Details"       value={fmt(p.houseDetails)} />
          <Field label="Family Status"       value={p.familyStatus === "MC" ? "Middle Class" : p.familyStatus === "UC" ? "Upper Class" : p.familyStatus === "EC" ? "Elite Class" : fmt(p.familyStatus)} />
        </Section>

        {/* Astrology */}
        <Section icon={<Star size={15} />} title="Astrology">
          <Field label="Rashi"          value={fmt(p.rashi)} />
          <Field label="Nakshatra"      value={fmt(p.nakshatra)} />
          <Field label="Lagnam"         value={fmt(p.lagnam)} />
          <Field label="Mother Tongue"  value={fmt(p.motherTongue)} />
        </Section>

        {/* Contact */}
        <Section icon={<Phone size={15} />} title="Contact Person">
          <Field label="Contact Name"    value={fmt(p.contactPersonName)} />
          <Field label="Contact Number"  value={fmt(p.contactNumber)} />
          <Field label="WhatsApp"        value={fmt(p.whatsappNo)} />
        </Section>

        {/* Bio & Expectations */}
        <Section icon={<FileText size={15} />} title="Bio & Expectations">
          <div className="mb-3">
            <p className="mb-1 text-xs text-neutral-400">Bio</p>
            <p className="text-sm text-neutral-800 whitespace-pre-wrap">{p.bio || "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-400">Expectations</p>
            <p className="text-sm text-neutral-800 whitespace-pre-wrap">{p.expectations || "—"}</p>
          </div>
        </Section>

      </div>

      {/* Bottom edit button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 rounded-xl border border-[#7a1f2b] px-6 py-2.5 text-sm font-semibold text-[#7a1f2b] hover:bg-[#7a1f2b]/5 transition-colors"
        >
          <Pencil size={14} />
          Edit Profile
        </button>
      </div>

    </div>
  );
}
