"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Eye, EyeOff,
  Edit2, Save, X,
  User, Users, Shield, Key,
  CheckCircle2, XCircle, AlertTriangle,
  FileText, Activity, ExternalLink,
  Snowflake, MapPin, Star, GraduationCap, Phone,
  Image as ImageIcon, CheckCircle, Clipboard,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: number; type: "success" | "error"; message: string };
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const add = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, []);
  return { toasts, dismiss, success: (m: string) => add("success", m), error: (m: string) => add("error", m) };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationDoc = { url: string; type: string; status: string; uploadedAt: string };

type UserDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  image: string | null;
  profileId: string | null;
  profileType: string | null;
  familyClass: string | null;
  autoPassword: string | null;
  status: string;
  verificationStatus: string;
  suspendReason: string | null;
  suspendedAt: string | null;
  notes: string | null;
  isFrozen: boolean;
  frozenAt: string | null;
  isAutoFrozen: boolean;
  autoFrozenAt: string | null;
  termsAcceptedAt: string | null;
  lastLogin: string | null;
  lastActivity: string | null;
  createdAt: string;
  updatedAt: string;
  verificationDocuments: VerificationDoc[];
};

type ProfileDetail = {
  id: string;
  profileStatus: string;
  profileType: string | null;
  familyClass: string | null;
  age: number | null;
  gender: string | null;
  dateOfBirth: string | null;
  religion: string | null;
  caste: string | null;
  subCaste: string | null;
  maritalStatus: string | null;
  motherTongue: string | null;
  height: number | null;
  weight: number | null;
  complexion: string | null;
  physicallyChallenge: boolean;
  location: string | null;
  address: string | null;
  nativeDistrict: string | null;
  placeOfBirth: string | null;
  timeOfBirth: string | null;
  rashi: string | null;
  nakshatra: string | null;
  lagnam: string | null;
  education: string | null;
  currentJob: string | null;
  income: number | null;
  monthlyIncome: number | null;
  fatherName: string | null;
  fatherOccupation: string | null;
  motherName: string | null;
  motherOccupation: string | null;
  totalBrothers: number | null;
  marriedBrothers: number | null;
  totalSisters: number | null;
  marriedSisters: number | null;
  houseDetails: string | null;
  familyStatus: string | null;
  contactPersonName: string | null;
  contactNumber: string | null;
  whatsappNo: string | null;
  bio: string | null;
  expectations: string | null;
  photos: string[];
  otherDetails: string | null;
  approvalDate: string | null;
  rejectionReason: string | null;
  flaggedReason: string | null;
  moderationNotes: string | null;
  contentScore: number | null;
  generatedCards: { MD: boolean; AD: boolean; CD: boolean; FD: boolean };
  isFrozen: boolean;
  frozenAt: string | null;
  frozenReason: string | null;
  isAutoFrozen: boolean;
  autoFrozenAt: string | null;
  lastActivity: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuditLog = {
  id: string;
  action: string;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  timestamp: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d?: string | Date | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDT = (d?: string | Date | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
      ? value ? "Yes" : "No"
      : String(value);
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-slate-900">{display}</p>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={15} className="text-[#7a1f2b]" />}
        <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

const TABS = ["Account", "Profile", "Documents", "Activity"] as const;
type Tab = (typeof TABS)[number];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const toast = useToast();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Account");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    verificationStatus: "",
    notes: "",
    suspendReason: "",
  });

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data.user);
      setProfile(data.profile ?? null);
      setAuditLogs(data.auditLogs ?? []);
      setFormData({
        status: data.user.status,
        verificationStatus: data.user.verificationStatus,
        notes: data.user.notes ?? "",
        suspendReason: data.user.suspendReason ?? "",
      });
    } catch {
      toast.error("Failed to load user");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success("User updated successfully");
      setEditing(false);
      loadUser();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#d4af37] border-t-[#7a1f2b] rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <User size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-medium text-slate-500">User not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-[#d4af37] text-[#7a1f2b] font-semibold rounded-lg hover:bg-[#c9a32e] transition"
          >
            Go Back
          </button>
        </div>
      </AdminLayout>
    );
  }

  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  const avatarBg =
    user.profileType === "BRIDE"
      ? "bg-pink-500"
      : user.profileType === "GROOM"
      ? "bg-blue-600"
      : "bg-[#7a1f2b]";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto ${
              t.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {t.type === "success"
              ? <CheckCircle size={16} className="text-green-600 shrink-0" />
              : <XCircle size={16} className="text-red-600 shrink-0" />}
            {t.message}
            <button onClick={() => toast.dismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition mb-4"
      >
        <ArrowLeft size={14} /> Back to Users
      </button>

      {/* ── Header Card ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white ${avatarBg}`}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-sm text-slate-500">
                  <span>{user.email}</span>
                  {user.phone && <span>· {user.phone}</span>}
                </div>
              </div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {user.profileType === "BRIDE" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700">Bride</span>
                )}
                {user.profileType === "GROOM" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Groom</span>
                )}
                {user.familyClass && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    {user.familyClass}
                  </span>
                )}
                <StatusBadge status={user.status} type="user" />
                <StatusBadge status={user.verificationStatus} type="verification" />
                {user.isFrozen && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    <Snowflake size={10} /> Frozen
                  </span>
                )}
              </div>
            </div>
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
              <span>
                Profile ID:{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">
                  {user.profileId ?? "—"}
                </code>
              </span>
              <span>
                Role: <span className="font-semibold text-slate-700">{user.role}</span>
              </span>
              <span>Joined: {fmt(user.createdAt)}</span>
              {user.lastLogin && <span>Last login: {fmtDT(user.lastLogin)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
              activeTab === tab
                ? "border-[#7a1f2b] text-[#7a1f2b]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
            {tab === "Documents" && user.verificationDocuments.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                {user.verificationDocuments.length}
              </span>
            )}
            {tab === "Activity" && auditLogs.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                {auditLogs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ ACCOUNT TAB ══════════════════════════════════════════════════════════ */}
      {activeTab === "Account" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Account Information */}
          <SectionCard title="Account Information" icon={User}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="Email" value={user.email} />
              <Field label="Phone" value={user.phone} />
              <Field label="Role" value={user.role} />
              <Field label="Profile Type" value={user.profileType} />
              <Field label="Family Class" value={user.familyClass} />
              <Field label="Profile ID" value={user.profileId} />
              <Field label="Joined" value={fmt(user.createdAt)} />
              <Field label="Last Updated" value={fmt(user.updatedAt)} />
              <Field label="Last Login" value={user.lastLogin ? fmtDT(user.lastLogin) : "Never"} />
              <Field label="Last Activity" value={user.lastActivity ? fmtDT(user.lastActivity) : "—"} />
              <Field
                label="Terms Accepted"
                value={user.termsAcceptedAt ? fmt(user.termsAcceptedAt) : "Not accepted"}
              />
            </div>
          </SectionCard>

          {/* Credentials */}
          <SectionCard title="Credentials" icon={Key}>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                System-Generated Password
              </p>
              {user.autoPassword ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm font-mono break-all">
                      {showPassword
                        ? user.autoPassword
                        : "•".repeat(Math.min(user.autoPassword.length, 20))}
                    </code>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      className="shrink-0 p-2.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                    <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                    Auto-generated at registration. If the user changed their password, this may be outdated.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No auto-password on record</p>
              )}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Password Hash</p>
                <p className="text-xs text-slate-400 italic">Hidden for security (bcrypt)</p>
              </div>
            </div>
          </SectionCard>

          {/* Freeze Status */}
          <SectionCard title="Account Freeze" icon={Snowflake}>
            <div className="space-y-3">
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  user.isFrozen ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
                }`}
              >
                <Snowflake size={16} className={user.isFrozen ? "text-blue-500" : "text-green-500"} />
                <div>
                  <p className={`text-sm font-bold ${user.isFrozen ? "text-blue-800" : "text-green-800"}`}>
                    Account {user.isFrozen ? "Frozen" : "Not Frozen"}
                  </p>
                  {user.frozenAt && (
                    <p className="text-xs text-blue-600">Since {fmtDT(user.frozenAt)}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Auto-Frozen" value={user.isAutoFrozen ? "Yes" : "No"} />
                {user.autoFrozenAt && <Field label="Auto-Frozen At" value={fmtDT(user.autoFrozenAt)} />}
              </div>
            </div>
          </SectionCard>

          {/* Status & Control */}
          <SectionCard title="Status & Control" icon={Shield}>
            <div className="space-y-3">
              {/* Account Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Suspend reason */}
              {(formData.status === "SUSPENDED" || formData.status === "BANNED") && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Reason
                  </label>
                  <textarea
                    value={formData.suspendReason}
                    onChange={(e) => setFormData({ ...formData, suspendReason: e.target.value })}
                    disabled={!editing}
                    placeholder="Why is this user suspended/banned?"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  />
                </div>
              )}

              {user.suspendedAt && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Suspended At</p>
                  <p className="text-sm text-slate-900">{fmtDT(user.suspendedAt)}</p>
                </div>
              )}

              {/* Verification Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Verification Status
                </label>
                <select
                  value={formData.verificationStatus}
                  onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                >
                  <option value="UNVERIFIED">Unverified</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Admin Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={!editing}
                  placeholder="Internal notes about this user…"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>

              {/* Actions */}
              {editing ? (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#7a1f2b] text-white text-sm font-semibold rounded-lg hover:bg-[#6a1a24] disabled:opacity-50 transition"
                  >
                    <Save size={14} />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); loadUser(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  <Edit2 size={14} /> Edit Account
                </button>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ══ PROFILE TAB ══════════════════════════════════════════════════════════ */}
      {activeTab === "Profile" && (
        !profile ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <User size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-500">No profile created yet</p>
            <p className="text-xs text-slate-400 mt-1">This user hasn&#39;t completed their profile setup</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Profile Overview */}
            <SectionCard title="Profile Overview" icon={Clipboard}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
                  <StatusBadge status={profile.profileStatus} type="profile" />
                </div>
                <Field label="Profile Type" value={profile.profileType} />
                <Field label="Family Class" value={profile.familyClass} />
                <Field
                  label="Content Score"
                  value={profile.contentScore !== null ? `${profile.contentScore}/100` : null}
                />
              </div>

              {/* Generated Cards */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Generated Cards</p>
                <div className="flex gap-2">
                  {(["MD", "AD", "CD", "FD"] as const).map((card) => (
                    <span
                      key={card}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        profile.generatedCards?.[card]
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {profile.generatedCards?.[card] ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <XCircle size={11} />
                      )}
                      {card}
                    </span>
                  ))}
                </div>
              </div>

              {/* Moderation alerts */}
              {profile.rejectionReason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-bold text-red-700 mb-0.5">Rejection Reason</p>
                  <p className="text-sm text-red-800">{profile.rejectionReason}</p>
                </div>
              )}
              {profile.flaggedReason && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs font-bold text-amber-700 mb-0.5">Flagged Reason</p>
                  <p className="text-sm text-amber-800">{profile.flaggedReason}</p>
                </div>
              )}
              {profile.moderationNotes && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs font-bold text-slate-600 mb-0.5">Moderation Notes</p>
                  <p className="text-sm text-slate-700">{profile.moderationNotes}</p>
                </div>
              )}
              {profile.approvalDate && (
                <div className="mt-3">
                  <Field label="Approved On" value={fmtDT(profile.approvalDate)} />
                </div>
              )}
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Personal Details */}
              <SectionCard title="Personal Details" icon={User}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Age" value={profile.age} />
                  <Field label="Gender" value={profile.gender} />
                  <Field
                    label="Date of Birth"
                    value={profile.dateOfBirth ? fmt(profile.dateOfBirth) : null}
                  />
                  <Field label="Marital Status" value={profile.maritalStatus} />
                  <Field label="Religion" value={profile.religion} />
                  <Field label="Caste" value={profile.caste} />
                  <Field label="Sub-Caste" value={profile.subCaste} />
                  <Field label="Mother Tongue" value={profile.motherTongue} />
                </div>
              </SectionCard>

              {/* Physical Attributes */}
              <SectionCard title="Physical Attributes" icon={User}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Height" value={profile.height ? `${profile.height} cm` : null} />
                  <Field label="Weight" value={profile.weight ? `${profile.weight} kg` : null} />
                  <Field label="Complexion" value={profile.complexion} />
                  <Field
                    label="Physically Challenged"
                    value={profile.physicallyChallenge ? "Yes" : "No"}
                  />
                </div>
              </SectionCard>

              {/* Location & Birth */}
              <SectionCard title="Location & Birth" icon={MapPin}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Current Location" value={profile.location} />
                  <Field label="Native District" value={profile.nativeDistrict} />
                  <Field label="Address" value={profile.address} />
                  <Field label="Place of Birth" value={profile.placeOfBirth} />
                  <Field label="Time of Birth" value={profile.timeOfBirth} />
                </div>
              </SectionCard>

              {/* Astrology */}
              <SectionCard title="Astrology" icon={Star}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Rashi" value={profile.rashi} />
                  <Field label="Nakshatra" value={profile.nakshatra} />
                  <Field label="Lagnam" value={profile.lagnam} />
                </div>
              </SectionCard>

              {/* Education & Career */}
              <SectionCard title="Education & Career" icon={GraduationCap}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Education" value={profile.education} />
                  <Field label="Current Job" value={profile.currentJob} />
                  <Field
                    label="Income"
                    value={profile.income ? `₹${profile.income.toLocaleString("en-IN")}` : null}
                  />
                  <Field
                    label="Monthly Income"
                    value={
                      profile.monthlyIncome
                        ? `₹${profile.monthlyIncome.toLocaleString("en-IN")}`
                        : null
                    }
                  />
                </div>
              </SectionCard>

              {/* Family Details */}
              <SectionCard title="Family Details" icon={Users}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Father's Name" value={profile.fatherName} />
                  <Field label="Father's Occupation" value={profile.fatherOccupation} />
                  <Field label="Mother's Name" value={profile.motherName} />
                  <Field label="Mother's Occupation" value={profile.motherOccupation} />
                  <Field
                    label="Brothers"
                    value={
                      profile.totalBrothers !== null
                        ? `${profile.totalBrothers} total, ${profile.marriedBrothers ?? 0} married`
                        : null
                    }
                  />
                  <Field
                    label="Sisters"
                    value={
                      profile.totalSisters !== null
                        ? `${profile.totalSisters} total, ${profile.marriedSisters ?? 0} married`
                        : null
                    }
                  />
                  <Field label="House Details" value={profile.houseDetails} />
                  <Field label="Family Status" value={profile.familyStatus} />
                </div>
              </SectionCard>

              {/* Contact Details */}
              <SectionCard title="Contact Details" icon={Phone}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Field label="Contact Person" value={profile.contactPersonName} />
                  <Field label="Contact Number" value={profile.contactNumber} />
                  <Field label="WhatsApp" value={profile.whatsappNo} />
                </div>
              </SectionCard>

              {/* Profile Freeze */}
              <SectionCard title="Profile Freeze" icon={Snowflake}>
                <div className="space-y-3">
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                      profile.isFrozen
                        ? "bg-blue-50 border-blue-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <Snowflake
                      size={15}
                      className={profile.isFrozen ? "text-blue-500" : "text-green-500"}
                    />
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          profile.isFrozen ? "text-blue-800" : "text-green-800"
                        }`}
                      >
                        Profile {profile.isFrozen ? "Frozen" : "Not Frozen"}
                      </p>
                      {profile.frozenReason && (
                        <p className="text-xs text-blue-600">{profile.frozenReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Auto-Frozen" value={profile.isAutoFrozen ? "Yes" : "No"} />
                    <Field
                      label="Last Activity"
                      value={profile.lastActivity ? fmt(profile.lastActivity) : null}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Bio & Expectations (full width) */}
            {(profile.bio || profile.expectations || profile.otherDetails) && (
              <SectionCard title="Bio & Expectations" icon={FileText}>
                {profile.bio && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bio</p>
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}
                {profile.expectations && (
                  <div className={profile.bio ? "pt-4 border-t border-slate-100" : ""}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Expectations
                    </p>
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {profile.expectations}
                    </p>
                  </div>
                )}
                {profile.otherDetails && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Other Details
                    </p>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{profile.otherDetails}</p>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Photos (full width) */}
            {profile.photos && profile.photos.length > 0 && (
              <SectionCard title={`Photos (${profile.photos.length})`} icon={ImageIcon}>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3">
                  {profile.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border border-slate-200 hover:opacity-80 transition"
                      />
                    </a>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )
      )}

      {/* ══ DOCUMENTS TAB ════════════════════════════════════════════════════════ */}
      {activeTab === "Documents" && (
        user.verificationDocuments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-500">No verification documents uploaded</p>
            <p className="text-xs text-slate-400 mt-1">Documents appear here once the user uploads them</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.verificationDocuments.map((doc, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-slate-100 rounded-xl">
                    <FileText size={18} className="text-slate-600" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      doc.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : doc.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 text-sm mb-1">{doc.type}</p>
                <p className="text-xs text-slate-500">Uploaded {fmt(doc.uploadedAt)}</p>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-sm text-[#7a1f2b] hover:text-[#6a1a24] font-semibold transition"
                  >
                    <ExternalLink size={13} /> View Document
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ══ ACTIVITY TAB ═════════════════════════════════════════════════════════ */}
      {activeTab === "Activity" && (
        auditLogs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <Activity size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-500">No activity recorded</p>
            <p className="text-xs text-slate-400 mt-1">Admin actions on this user will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4">
                <div className="shrink-0 w-8 h-8 bg-[#faf7f2] border border-[#d4af37]/30 rounded-full flex items-center justify-center">
                  <Activity size={14} className="text-[#7a1f2b]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {log.action
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="text-xs text-slate-500 shrink-0">{fmtDT(log.timestamp)}</p>
                  </div>
                  {log.changes?.before && (
                    <div className="space-y-0.5 mt-1">
                      {Object.keys(log.changes.before).map((key) => {
                        const before = (log.changes?.before as Record<string, unknown>)?.[key];
                        const after = (log.changes?.after as Record<string, unknown>)?.[key];
                        if (before === after) return null;
                        return (
                          <p key={key} className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-600">{key}</span>:{" "}
                            <span className="text-red-500 line-through">{String(before ?? "—")}</span>
                            {" → "}
                            <span className="text-green-600 font-medium">{String(after ?? "—")}</span>
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </AdminLayout>
  );
}
