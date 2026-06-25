"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MatrimonyProfileForm } from "@/components/MatrimonyProfileForm";
import {
  Users, UserCheck, User, Heart, CreditCard, BarChart3,
  CheckCircle, Eye, EyeOff, AlertCircle, Database, Lock,
  HardDrive, MessageCircle, Home, Snowflake, ChevronDown, Settings,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type DashboardStats = {
  users: number;
  activeUsers: number;
  profiles: number;
  interests: number;
  acceptedInterests: number;
  pendingPayments: number;
};

type UserProfile = {
  _id?: string;
  userId?: string;
  profileStatus?: string;
  rejectionReason?: string;
  updatedAt?: string;
  [key: string]: any;
};

type UserData = {
  name: string;
  profileId?: string;
  autoPassword?: string;
  profileType: "GROOM" | "BRIDE";
  familyClass?: string;
  isFrozen?: boolean;
  isAutoFrozen?: boolean;
  frozenAt?: string | null;
  autoFrozenAt?: string | null;
};

// ─── Chart types & colours ────────────────────────────────────────────────────

type ChartData = {
  userGrowth:        { date: string; count: number }[];
  profileStatus:     { status: string; count: number }[];
  genderRatio:       { type: string; count: number }[];
  religionBreakdown: { religion: string; count: number }[];
  paymentsChart:     { month: string; approved: number; pending: number }[];
};

const PROFILE_STATUS_COLORS: Record<string, string> = {
  APPROVED:         "#7a1f2b",
  PENDING_APPROVAL: "#d4af37",
  DRAFT:            "#94a3b8",
  REJECTED:         "#ef4444",
  FLAGGED:          "#f97316",
};
const PROFILE_STATUS_LABELS: Record<string, string> = {
  APPROVED: "Approved", PENDING_APPROVAL: "Pending",
  DRAFT: "Draft", REJECTED: "Rejected", FLAGGED: "Flagged",
};
const RELIGION_COLORS = ["#7a1f2b", "#985060", "#b07880", "#d4af37", "#c9a0a8"];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">{title}</p>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      {label && <p className="text-slate-500 mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} className="font-bold" style={{ color: p.color ?? p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 leading-tight">
          {label}
        </p>
        <p className={`mt-1 font-serif text-2xl font-bold leading-none ${color}`}>
          {value.toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );

  const cls =
    "bg-white dark:bg-neutral-100 rounded-xl border border-neutral-200 dark:border-neutral-200 p-4 hover:shadow-md transition-shadow block";

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function AdminDashboard({ stats, charts }: { stats: DashboardStats; charts: ChartData | null }) {
  const brideCount = charts?.genderRatio.find((g) => g.type === "BRIDE")?.count ?? 0;
  const groomCount = charts?.genderRatio.find((g) => g.type === "GROOM")?.count ?? 0;
  const genderBarData = [
    { name: "Bride", count: brideCount },
    { name: "Groom", count: groomCount },
  ];

  return (
    <div className="space-y-6">
      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={<Users size={20} className="text-primary" />}
          label="Total Users"
          value={stats.users}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          icon={<UserCheck size={20} className="text-success" />}
          label="Active Users"
          value={stats.activeUsers}
          color="text-success"
          bg="bg-success/10"
        />
        <StatCard
          icon={<User size={20} className="text-accent" />}
          label="Profiles"
          value={stats.profiles}
          color="text-accent"
          bg="bg-accent/10"
        />
        <StatCard
          icon={<Heart size={20} className="text-error" />}
          label="Interests Sent"
          value={stats.interests}
          color="text-error"
          bg="bg-error/10"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-success" />}
          label="Accepted"
          value={stats.acceptedInterests}
          color="text-success"
          bg="bg-success/10"
        />
        <StatCard
          icon={<CreditCard size={20} className="text-warning" />}
          label="Pending Payments"
          value={stats.pendingPayments}
          color="text-warning"
          bg="bg-warning/10"
          href="/admin/payments"
        />
      </div>

      {/* ── Chart Row 1 — User Growth + Profile Status ───────────────────── */}
      {charts && (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ChartCard title="User Registrations — Last 30 Days">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={charts.userGrowth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="maroonGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7a1f2b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7a1f2b" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Registrations" stroke="#7a1f2b" strokeWidth={2} fill="url(#maroonGrad)" dot={false} activeDot={{ r: 4, fill: "#7a1f2b" }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div className="lg:col-span-2">
            <ChartCard title="Profile Status">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={charts.profileStatus} dataKey="count" nameKey="status" cx="50%" cy="45%" innerRadius={52} outerRadius={78} paddingAngle={2}>
                    {charts.profileStatus.map((entry) => (
                      <Cell key={entry.status} fill={PROFILE_STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any) => [value, PROFILE_STATUS_LABELS[name] ?? name]} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => (
                    <span style={{ fontSize: 10, color: "#64748b" }}>{PROFILE_STATUS_LABELS[value] ?? value}</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── Chart Row 2 — Gender + Religion + Payments ───────────────────── */}
      {charts && (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Bride / Groom Ratio">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={genderBarData} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "#94a3b8" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                  {genderBarData.map((entry) => (
                    <Cell key={entry.name} fill={entry.name === "Bride" ? "#d4af37" : "#7a1f2b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Religion Breakdown">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={charts.religionBreakdown} layout="vertical" margin={{ top: 0, right: 24, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "#94a3b8" }} allowDecimals={false} />
                <YAxis type="category" dataKey="religion" tick={{ fontSize: 10, fill: "#475569" }} width={60}
                  tickFormatter={(v) => v === "CHRISTIAN" ? "Christian" : v === "MUSLIM" ? "Muslim" : v === "HINDU" ? "Hindu" : v === "OTHER" ? "Other" : v}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Profiles" radius={[0, 4, 4, 0]}>
                  {charts.religionBreakdown.map((_, i) => (
                    <Cell key={i} fill={RELIGION_COLORS[i % RELIGION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Payments — Last 6 Months">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={charts.paymentsChart} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => (
                  <span style={{ fontSize: 10, color: "#64748b" }}>{v === "approved" ? "Approved" : "Pending"}</span>
                )} />
                <Bar dataKey="approved" name="approved" fill="#7a1f2b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pending"  name="pending"  fill="#d4af37" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ── Quick Links ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/admin/users",     icon: Users,        bg: "bg-primary/10",   hover: "group-hover:bg-primary/20",   color: "text-primary",     title: "User Management",      desc: "Manage accounts, status and freeze state" },
          { href: "/admin/profiles",  icon: User,         bg: "bg-accent/10",    hover: "group-hover:bg-accent/20",    color: "text-accent",      title: "Profile Management",   desc: "Review, approve and reject profiles" },
          { href: "/admin/payments",  icon: CreditCard,   bg: "bg-warning/10",   hover: "group-hover:bg-warning/20",   color: "text-warning",     title: "Payments",             desc: "Approve pending payment submissions" },
          { href: "/admin/analytics", icon: BarChart3,    bg: "bg-success/10",   hover: "group-hover:bg-success/20",   color: "text-success",     title: "Analytics",            desc: "View platform metrics and trends" },
          { href: "/admin/reports",   icon: AlertCircle,  bg: "bg-error/10",     hover: "group-hover:bg-error/20",     color: "text-error",       title: "Reports & Moderation", desc: "Handle user reports and flagged content" },
          { href: "/admin/settings",  icon: Settings,     bg: "bg-neutral-100",  hover: "group-hover:bg-neutral-200",  color: "text-neutral-600", title: "Settings",             desc: "Configure platform and payment settings" },
        ].map(({ href, icon: Icon, bg, hover, color, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-white dark:bg-neutral-100 rounded-xl border border-neutral-200 dark:border-neutral-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className={`p-2.5 ${bg} rounded-lg ${hover} transition-colors`}>
                <Icon size={18} className={color} />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-900">{title}</h3>
            </div>
            <p className="text-sm text-neutral-500">{desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Action Items + Platform Health ────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Action links — span 2 columns */}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/verification"
            className="bg-white dark:bg-neutral-100 rounded-xl border border-neutral-200 dark:border-neutral-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2 bg-warning/10 rounded-lg group-hover:bg-warning/20 transition-colors">
                <CheckCircle size={16} className="text-warning" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-900">Verification Queue</h3>
            </div>
            <p className="text-sm text-neutral-500">
              Review user identity documents and approve pending accounts
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="bg-white dark:bg-neutral-100 rounded-xl border border-neutral-200 dark:border-neutral-200 p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2 bg-error/10 rounded-lg group-hover:bg-error/20 transition-colors">
                <AlertCircle size={16} className="text-error" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-neutral-900">Reports</h3>
            </div>
            <p className="text-sm text-neutral-500">
              Review flagged content and moderate user reports
            </p>
          </Link>
        </div>

        {/* Platform Health */}
        <div className="bg-white dark:bg-neutral-100 rounded-xl border border-neutral-200 dark:border-neutral-200 p-5">
          <h3 className="font-bold text-neutral-900 dark:text-neutral-900 mb-4">Platform Health</h3>
          <div className="space-y-3.5">
            {[
              { label: "Database",     status: "Connected",  icon: Database  },
              { label: "Auth System",  status: "Active",     icon: Lock      },
              { label: "File Storage", status: "Cloudinary", icon: HardDrive },
            ].map(({ label, status, icon: IconComp }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-success/10 rounded-md">
                    <IconComp size={14} className="text-success" />
                  </div>
                  <span className="text-sm text-neutral-600">{label}</span>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Completion Card ──────────────────────────────────────────────────

const COMPLETION_FIELDS: { key: string; label: string }[] = [
  { key: "photos",      label: "At least one photo" },
  { key: "bio",         label: "Bio / about section" },
  { key: "height",      label: "Height" },
  { key: "complexion",  label: "Complexion" },
  { key: "currentJob",  label: "Occupation / job" },
  { key: "nakshatra",   label: "Nakshatra" },
  { key: "rashi",       label: "Rashi" },
  { key: "expectations",label: "Expectations" },
];

function ProfileCompletionCard({
  profile,
  onEdit,
}: {
  profile: UserProfile;
  onEdit: () => void;
}) {
  const filled = COMPLETION_FIELDS.filter(({ key }) => {
    const val = profile[key];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== null && val !== "";
  });
  const missing = COMPLETION_FIELDS.filter(({ key }) => {
    const val = profile[key];
    if (Array.isArray(val)) return val.length === 0;
    return val === undefined || val === null || val === "";
  });
  const pct = Math.round((filled.length / COMPLETION_FIELDS.length) * 100);
  const isComplete = pct === 100;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-neutral-200 bg-white dark:bg-neutral-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest">
          Profile Completion
        </p>
        <span className={`text-sm font-extrabold ${isComplete ? "text-green-700" : "text-[#7a1f2b]"}`}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-neutral-200 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            isComplete ? "bg-green-500" : pct >= 60 ? "bg-[#d4af37]" : "bg-[#7a1f2b]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isComplete ? (
        <p className="mt-2 text-xs text-green-700 font-semibold flex items-center gap-1">
          <CheckCircle size={12} /> Your profile is fully complete!
        </p>
      ) : (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-neutral-700 mb-1.5">
            Missing ({missing.length}):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map(({ label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
              >
                {label}
              </span>
            ))}
          </div>
          <button
            onClick={onEdit}
            className="mt-3 text-xs font-semibold text-[#7a1f2b] underline hover:no-underline"
          >
            Fill in missing details →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── User Dashboard ───────────────────────────────────────────────────────────

const PROFILE_STATUS: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  DRAFT:            { label: "Draft",        color: "text-slate-600",  bg: "bg-slate-100",  desc: "Complete your profile to start connecting" },
  PENDING_APPROVAL: { label: "Under Review", color: "text-amber-700",  bg: "bg-amber-100",  desc: "Our team is reviewing your profile" },
  APPROVED:         { label: "Live",         color: "text-green-700",  bg: "bg-green-100",  desc: "Your profile is visible to families" },
  REJECTED:         { label: "Rejected",     color: "text-red-700",    bg: "bg-red-100",    desc: "Your profile needs changes — see feedback below" },
  FLAGGED:          { label: "Flagged",      color: "text-orange-700", bg: "bg-orange-100", desc: "Your profile has been flagged for review" },
};

const fmt = (d?: string | null) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function UserDashboard({ userData, profile, loadError, onRetry }: { userData: UserData; profile: UserProfile | null; loadError?: boolean; onRetry?: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  // Auto-open form if user has no profile yet
  const [formOpen, setFormOpen] = useState(!profile);

  const isGroom = userData.profileType === "GROOM";
  const profileStatus = (profile?.profileStatus as string) ?? "DRAFT";
  const st = PROFILE_STATUS[profileStatus] ?? PROFILE_STATUS.DRAFT;
  const isFrozen = !!(userData.isFrozen || userData.isAutoFrozen);

  const scrollToForm = () => {
    setFormOpen(true);
    setTimeout(() => document.getElementById("profile-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const groomSteps = [
    "Complete your profile with all details",
    "Browse bride profiles matching your preferences",
    "Send interest to families you like",
    "Pay to unlock contact details",
  ];
  const brideSteps = [
    "Complete your profile with details & photos",
    "Wait for approval from our team",
    "Review proposals from groom families",
    "Connect with approved matches",
  ];

  return (
    <div className="bg-[#faf7f2] dark:bg-neutral-100 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {loadError && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>⚠️ Some data failed to load — showing limited information.</span>
            {onRetry && (
              <button onClick={onRetry} className="ml-3 shrink-0 text-xs font-semibold underline hover:no-underline">
                Retry
              </button>
            )}
          </div>
        )}

        {/* ── Profile Completion (First Section) ───────────────────────────────── */}
        {profile && <ProfileCompletionCard profile={profile} onEdit={scrollToForm} />}

        {/* ── Row 1: Welcome + Profile Status ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Welcome card */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-[#7a1f2b] to-[#5a1820] p-6 text-white flex flex-col justify-between min-h-[180px]">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isGroom ? "bg-blue-400/30 text-blue-100" : "bg-pink-400/30 text-pink-100"
              }`}>
                {isGroom ? "Groom" : "Bride"}
              </span>
              {userData.familyClass && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4af37]/30 text-[#d4af37]">
                  {userData.familyClass}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome, {userData.name}!</h1>
              <p className="text-white/80 text-sm leading-relaxed">
                {isGroom
                  ? "Browse bride profiles, send interests, and find your perfect match."
                  : "Review marriage proposals from families and connect with your match."}
              </p>
            </div>

            {/* Freeze warning */}
            {isFrozen && (
              <div className="mt-4 flex items-start gap-2.5 bg-blue-500/20 border border-blue-400/30 px-4 py-3 rounded-xl text-sm">
                <Snowflake size={16} className="text-blue-300 shrink-0 mt-0.5" />
                <span className="text-blue-100">
                  Your account is currently{" "}
                  <strong>{userData.isAutoFrozen ? "auto-frozen" : "frozen"}</strong>
                  {userData.isAutoFrozen
                    ? " due to inactivity."
                    : "."}
                  {" "}Visit Settings to unfreeze.
                </span>
              </div>
            )}
          </div>

          {/* Profile Status card */}
          <div className="bg-white dark:bg-neutral-100 rounded-2xl border border-slate-200 dark:border-neutral-200 p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-3">
                Profile Status
              </p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${st.bg} ${st.color}`}>
                {st.label}
              </span>
              <p className="text-sm text-slate-500 dark:text-neutral-700 mt-2 leading-relaxed">{st.desc}</p>

              {/* Rejection reason */}
              {profileStatus === "REJECTED" && profile?.rejectionReason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-xs font-bold text-red-700 mb-0.5">Rejection Reason</p>
                  <p className="text-sm text-red-800 leading-relaxed">{profile.rejectionReason}</p>
                </div>
              )}

              {profile?.updatedAt && (
                <p className="text-xs text-slate-400 mt-3">
                  Last updated: {fmt(profile.updatedAt)}
                </p>
              )}
            </div>

            <button
              onClick={scrollToForm}
              className="mt-4 w-full px-4 py-2.5 bg-[#7a1f2b] text-white text-sm font-semibold rounded-xl hover:bg-[#6a1a24] transition"
            >
              {profile ? "Edit Profile" : "Create Profile"}
            </button>
          </div>
        </div>

        {/* ── Row 2: Credentials / Account Info / How It Works ─────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Credentials */}
          <div className="bg-gradient-to-br from-white to-[#fff9ef] dark:from-neutral-100 dark:to-neutral-100 rounded-2xl border border-[#d4af37]/40 p-5">
            <p className="text-[10px] font-bold text-[#7a1f2b] uppercase tracking-widest mb-4">
              Login Credentials
            </p>
            <div className="space-y-4">
              {userData.profileId ? (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Profile ID
                  </p>
                  <code className="block text-sm font-mono font-bold text-[#7a1f2b] bg-[#7a1f2b]/8 px-3 py-2 rounded-lg break-all">
                    {userData.profileId}
                  </code>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Profile not yet created</p>
              )}

              {userData.autoPassword && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Password
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono font-bold text-[#7a1f2b] bg-[#7a1f2b]/8 px-3 py-2 rounded-lg">
                      {showPassword
                        ? userData.autoPassword
                        : "•".repeat(Math.min(userData.autoPassword.length, 12))}
                    </code>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-white hover:text-slate-700 transition bg-white/60"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Use these to log in on any device
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-neutral-100 rounded-2xl border border-slate-200 dark:border-neutral-200 p-5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-4">
              Account
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-neutral-700">Profile Type</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isGroom ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                }`}>
                  {isGroom ? "Groom" : "Bride"}
                </span>
              </div>

              {userData.familyClass && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-neutral-700">Family Class</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    {userData.familyClass}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-neutral-700">Account Status</span>
                <span className={`text-xs font-semibold ${
                  isFrozen ? "text-blue-600" : "text-green-600"
                }`}>
                  {isFrozen
                    ? userData.isAutoFrozen ? "Auto-Frozen" : "Frozen"
                    : "Active"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-neutral-700">Profile Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${st.bg} ${st.color}`}>
                  {st.label}
                </span>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white dark:bg-neutral-100 rounded-2xl border border-slate-200 dark:border-neutral-200 p-5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-4">
              {isGroom ? "How It Works" : "For Bride Families"}
            </p>
            <ol className="space-y-2.5">
              {(isGroom ? groomSteps : brideSteps).map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-neutral-700">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#7a1f2b]/10 text-[#7a1f2b] text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Profile Form (collapsible) ────────────────────────────────────── */}
        <div id="profile-form" className="bg-white dark:bg-neutral-100 rounded-2xl border border-slate-200 dark:border-neutral-200 overflow-hidden">
          {/* Toggle header */}
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 dark:hover:bg-neutral-200 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#7a1f2b]/10 rounded-xl">
                <User size={18} className="text-[#7a1f2b]" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-neutral-900">
                  {profile ? "Edit Your Profile" : "Complete Your Profile"}
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-700 mt-0.5">
                  {profile
                    ? "Update your details, photos, and expectations"
                    : "Fill in your matrimony profile to start connecting with families"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.bg} ${st.color}`}>
                {st.label}
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform duration-200 ${formOpen ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {/* Form body */}
          {formOpen && (
            <div className="border-t border-slate-100 dark:border-neutral-200 px-6 py-6">
              <MatrimonyProfileForm defaultProfile={profile ? { ...profile, name: userData.name } : null} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminStats, setAdminStats] = useState<DashboardStats>({
    users: 0,
    activeUsers: 0,
    profiles: 0,
    interests: 0,
    acceptedInterests: 0,
    pendingPayments: 0,
  });
  const [adminCharts, setAdminCharts] = useState<ChartData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadAdminStats = useCallback(async () => {
    try {
      const [statsRes, chartsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/dashboard-charts"),
      ]);
      if (statsRes.ok)  setAdminStats(await statsRes.json());
      if (chartsRes.ok) setAdminCharts(await chartsRes.json());
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    setLoadError(false);
    try {
      // ?credentials=1 tells the API to include autoPassword for the dashboard card
      const res = await fetch("/api/user/profile?credentials=1");
      if (!res.ok) throw new Error("Failed to load user data");
      const data = await res.json();
      setUserData(data.user);
      setProfile(data.profile);
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserData(session?.user as unknown as UserData);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session?.user?.role === "ADMIN") {
        loadAdminStats();
      } else {
        loadUserData();
      }
    }
  }, [status, session, router, loadAdminStats, loadUserData]);

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf7f2] dark:bg-neutral-100">
        <div className="w-8 h-8 border-4 border-[#d4af37] border-t-[#7a1f2b] rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  // Admin view
  if (session.user.role === "ADMIN") {
    return (
      <AdminLayout>
        <AdminHeader title="Dashboard" description="Platform overview and metrics" />
        <AdminDashboard stats={adminStats} charts={adminCharts} />
      </AdminLayout>
    );
  }

  // User view
  if (userData) {
    return <UserDashboard userData={userData} profile={profile} loadError={loadError} onRetry={loadUserData} />;
  }

  return null;
}
