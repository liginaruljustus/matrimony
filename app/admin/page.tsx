"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  Users,
  UserCheck,
  User,
  Heart,
  CreditCard,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Database,
  Lock,
  HardDrive,
  ChevronRight,
} from "lucide-react";

type DashboardStats = {
  users: number;
  activeUsers: number;
  profiles: number;
  interests: number;
  acceptedInterests: number;
  pendingPayments: number;
};

function StatCard({ icon: IconComponent, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
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

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    activeUsers: 0,
    profiles: 0,
    interests: 0,
    acceptedInterests: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    } else if (status === "authenticated") {
      loadStats();
    }
  }, [status, session, router]);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
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

  return (
    <AdminLayout>
      <AdminHeader title="Dashboard" description="Platform overview and metrics" />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<Users size={24} className="text-blue-600" />} label="Total Users" value={stats.users} color="text-blue-600" bg="bg-blue-100" />
          <StatCard icon={<UserCheck size={24} className="text-green-600" />} label="Active Users" value={stats.activeUsers} color="text-green-600" bg="bg-green-100" />
          <StatCard icon={<User size={24} className="text-purple-600" />} label="Profiles" value={stats.profiles} color="text-purple-600" bg="bg-purple-100" />
          <StatCard icon={<Heart size={24} className="text-pink-600" />} label="Interests" value={stats.interests} color="text-pink-600" bg="bg-pink-100" />
          <Link href="/admin/payments" className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <CreditCard size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Pending Payments</p>
                <p className="mt-0.5 font-serif text-3xl font-bold text-amber-600">
                  {stats.pendingPayments}
                </p>
              </div>
            </div>
          </Link>
        </div>

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
                { label: "Database", status: "Connected", ok: true, icon: Database },
                { label: "Auth System", status: "Active", ok: true, icon: Lock },
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
