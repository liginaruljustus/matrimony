"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, UserCheck, User, Heart, CreditCard,
  BarChart3, AlertCircle, CheckCircle,
  Database, Lock, HardDrive, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DashboardStats = {
  users: number;
  activeUsers: number;
  profiles: number;
  interests: number;
  acceptedInterests: number;
  pendingPayments: number;
};

type ChartData = {
  userGrowth:        { date: string; count: number }[];
  profileStatus:     { status: string; count: number }[];
  genderRatio:       { type: string; count: number }[];
  religionBreakdown: { religion: string; count: number }[];
  paymentsChart:     { month: string; approved: number; pending: number }[];
};

// ── Colour maps ───────────────────────────────────────────────────────────────

const PROFILE_STATUS_COLORS: Record<string, string> = {
  APPROVED:         "#7a1f2b",
  PENDING_APPROVAL: "#d4af37",
  DRAFT:            "#94a3b8",
  REJECTED:         "#ef4444",
  FLAGGED:          "#f97316",
};
const PROFILE_STATUS_LABELS: Record<string, string> = {
  APPROVED:         "Approved",
  PENDING_APPROVAL: "Pending",
  DRAFT:            "Draft",
  REJECTED:         "Rejected",
  FLAGGED:          "Flagged",
};

const RELIGION_COLORS = ["#7a1f2b", "#985060", "#b07880", "#d4af37", "#c9a0a8"];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon: IconComponent, label, value, color, bg,
}: {
  icon: React.ReactNode; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}>
          {IconComponent}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</p>
          <p className={`mt-0.5 font-serif text-3xl font-bold ${color}`}>
            {value.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [stats, setStats] = useState<DashboardStats>({
    users: 0, activeUsers: 0, profiles: 0,
    interests: 0, acceptedInterests: 0, pendingPayments: 0,
  });
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    } else if (status === "authenticated") {
      loadAll();
    }
  }, [status, session, router]);

  const loadAll = async () => {
    try {
      const [statsRes, chartsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/dashboard-charts"),
      ]);
      if (statsRes.ok)  setStats(await statsRes.json());
      if (chartsRes.ok) setCharts(await chartsRes.json());
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#d4af37] border-t-[#7a1f2b] rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const brideCount = charts?.genderRatio.find((g) => g.type === "BRIDE")?.count ?? 0;
  const groomCount = charts?.genderRatio.find((g) => g.type === "GROOM")?.count ?? 0;
  const genderBarData = [
    { name: "Bride", count: brideCount },
    { name: "Groom", count: groomCount },
  ];

  return (
    <AdminLayout>
      <AdminHeader title="Dashboard" description="Platform overview and metrics" />

      <div className="space-y-6">

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<Users size={24} className="text-blue-600" />}      label="Total Users"       value={stats.users}        color="text-blue-600"   bg="bg-blue-100" />
          <StatCard icon={<UserCheck size={24} className="text-green-600" />}  label="Active Users"      value={stats.activeUsers}  color="text-green-600"  bg="bg-green-100" />
          <StatCard icon={<User size={24} className="text-purple-600" />}      label="Profiles"          value={stats.profiles}     color="text-purple-600" bg="bg-purple-100" />
          <StatCard icon={<Heart size={24} className="text-pink-600" />}       label="Interests"         value={stats.interests}    color="text-pink-600"   bg="bg-pink-100" />
          <Link href="/admin/payments" className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <CreditCard size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Pending Payments</p>
                <p className="mt-0.5 font-serif text-3xl font-bold text-amber-600">{stats.pendingPayments}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Chart Row 1 — User Growth + Profile Status Donut */}
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
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Registrations"
                      stroke="#7a1f2b"
                      strokeWidth={2}
                      fill="url(#maroonGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#7a1f2b" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="lg:col-span-2">
              <ChartCard title="Profile Status">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={charts.profileStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="45%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {charts.profileStatus.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={PROFILE_STATUS_COLORS[entry.status] ?? "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [value, PROFILE_STATUS_LABELS[name] ?? name]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 10, color: "#64748b" }}>
                          {PROFILE_STATUS_LABELS[value] ?? value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* Chart Row 2 — Gender + Religion + Payments */}
        {charts && (
          <div className="grid gap-4 lg:grid-cols-3">

            <ChartCard title="Bride / Groom Ratio">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={genderBarData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                >
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
                <BarChart
                  data={charts.religionBreakdown}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#94a3b8" }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="religion"
                    tick={{ fontSize: 10, fill: "#475569" }}
                    width={60}
                    tickFormatter={(v) =>
                      v === "CHRISTIAN" ? "Christian" :
                      v === "MUSLIM"    ? "Muslim"    :
                      v === "HINDU"     ? "Hindu"     :
                      v === "OTHER"     ? "Other"     : v
                    }
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
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span style={{ fontSize: 10, color: "#64748b" }}>
                        {v === "approved" ? "Approved" : "Pending"}
                      </span>
                    )}
                  />
                  <Bar dataKey="approved" name="approved" fill="#7a1f2b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="pending"  name="pending"  fill="#d4af37" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/users" className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-slate-900" />
              <h3 className="font-bold text-slate-900">User Management</h3>
            </div>
            <p className="text-sm text-slate-600">Manage user accounts and status</p>
          </Link>
          <Link href="/admin/profiles" className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-2">
              <User size={20} className="text-slate-900" />
              <h3 className="font-bold text-slate-900">Profile Management</h3>
            </div>
            <p className="text-sm text-slate-600">Review and approve profiles</p>
          </Link>
          <Link href="/admin/analytics" className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={20} className="text-slate-900" />
              <h3 className="font-bold text-slate-900">Analytics</h3>
            </div>
            <p className="text-sm text-slate-600">View platform metrics and trends</p>
          </Link>
          <Link href="/admin/reports" className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle size={20} className="text-slate-900" />
              <h3 className="font-bold text-slate-900">Reports & Moderation</h3>
            </div>
            <p className="text-sm text-slate-600">Handle user reports and flags</p>
          </Link>
        </div>

        {/* Pending Items */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Link href="/admin/payments" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-900">Pending Payments</h3>
              </div>
              <span className="text-2xl font-bold text-amber-600">{stats.pendingPayments}</span>
            </div>
            <p className="text-sm text-slate-600">Review and approve pending payment submissions</p>
          </Link>

          <Link href="/admin/verification" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-yellow-600" />
                <h3 className="font-bold text-slate-900">Verification Queue</h3>
              </div>
              <ChevronRight size={20} className="text-yellow-600" />
            </div>
            <p className="text-sm text-slate-600">Review user verification documents</p>
          </Link>

          <Link href="/admin/reports" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <h3 className="font-bold text-slate-900">Reports</h3>
              </div>
              <ChevronRight size={20} className="text-red-600" />
            </div>
            <p className="text-sm text-slate-600">Review user reports and moderate content</p>
          </Link>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Platform Health</h3>
            <div className="space-y-3">
              {[
                { label: "Database",     status: "Connected",  ok: true, icon: Database },
                { label: "Auth System",  status: "Active",     ok: true, icon: Lock },
                { label: "File Storage", status: "Cloudinary", ok: true, icon: HardDrive },
              ].map(({ label, status, ok, icon: IconComp }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComp size={16} className={ok ? "text-green-600" : "text-red-600"} />
                    <span className="text-sm text-slate-600">{label}</span>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${ok ? "text-green-600" : "text-red-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
