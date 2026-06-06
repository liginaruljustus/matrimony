"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, CheckCircle, Clipboard, User, TrendingUp, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";

type Analytics = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalProfiles: number;
    approvedProfiles: number;
    pendingProfiles: number;
    rejectedProfiles: number;
    totalInterests: number;
    acceptedInterests: number;
    pendingPayments: number;
    approvedPayments: number;
    brides: number;
    grooms: number;
    profileApprovalRate: number;
    interestAcceptanceRate: number;
  };
  charts: {
    userGrowth: Array<{ date: string; count: number }>;
    genderDistribution: Array<{ name: string; value: number }>;
    verificationStatus: Array<{ status: string; count: number }>;
    profileStatusDistribution: Array<{ status: string; count: number }>;
    paymentStatus: Array<{ status: string; count: number }>;
    userStatus: Array<{ status: string; count: number }>;
  };
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#d4af37] border-t-[#7a1f2b] rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <AdminHeader title="Analytics" description="Platform analytics and metrics" />
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-slate-500">Failed to load analytics data</p>
          <button
            onClick={() => loadAnalytics()}
            className="flex items-center gap-2 px-4 py-2 bg-[#7a1f2b] text-white text-sm font-semibold rounded-lg hover:bg-[#6b1823] transition"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { stats, charts } = analytics;

  return (
    <AdminLayout>
      <div className="relative">
        <AdminHeader title="Analytics" description="Real-time platform metrics and trends" />
        <button
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          className="absolute right-0 top-0 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Users Metric */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 mb-2">TOTAL USERS</p>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
            <p className="text-sm text-green-600 font-semibold">{stats.activeUsers} active</p>
          </div>
          <div className="text-xs text-slate-500">
            {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : "0"}% active rate
          </div>
        </div>

        {/* Profiles Metric */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 mb-2">TOTAL PROFILES</p>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-slate-900">{stats.totalProfiles}</p>
            <p className="text-sm text-green-600 font-semibold">{stats.approvedProfiles} approved</p>
          </div>
          <div className="text-xs text-slate-500">
            {stats.profileApprovalRate.toFixed(1)}% approval rate
          </div>
        </div>

        {/* Gender Distribution Metric */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 mb-2">GENDER DISTRIBUTION</p>
          <div className="flex items-baseline gap-3 mb-2">
            <div>
              <p className="text-xs text-slate-500">Brides</p>
              <p className="text-xl font-bold text-slate-900">{stats.brides}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Grooms</p>
              <p className="text-xl font-bold text-slate-900">{stats.grooms}</p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {(() => {
              const total = stats.brides + stats.grooms;
              if (total === 0) return "No profiles yet";
              const b = Math.round((stats.brides / total) * 100);
              return `Ratio: ${b}% / ${100 - b}%`;
            })()}
          </div>
        </div>

        {/* Interest Metric */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 mb-2">INTERESTS & MATCHES</p>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-slate-900">{stats.totalInterests}</p>
            <p className="text-sm text-green-600 font-semibold">{stats.acceptedInterests} accepted</p>
          </div>
          <div className="text-xs text-slate-500">
            {stats.interestAcceptanceRate.toFixed(1)}% match rate
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Payment Metric */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 mb-4">PAYMENT STATUS</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-900">Pending Review</p>
              <p className="text-lg font-bold text-amber-600">{stats.pendingPayments}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-900">Approved</p>
              <p className="text-lg font-bold text-green-600">{stats.approvedPayments}</p>
            </div>
          </div>
        </div>

        {/* Profile Status Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 mb-4">PROFILE STATUS</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-900">Pending Approval</p>
              <p className="text-lg font-bold text-blue-600">{stats.pendingProfiles}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-900">Rejected</p>
              <p className="text-lg font-bold text-red-600">{stats.rejectedProfiles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-slate-900" />
            <h3 className="font-bold text-slate-900">Gender Distribution</h3>
          </div>
          <div className="space-y-3">
            {charts.genderDistribution.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-700">{item.name}</p>
                  <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition ${
                      item.name === "Bride" ? "bg-pink-500" : "bg-blue-500"
                    }`}
                    style={{
                      width: `${(item.value / Math.max(...charts.genderDistribution.map((c) => c.value), 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Status Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-slate-900" />
            <h3 className="font-bold text-slate-900">Verification Status</h3>
          </div>
          <div className="space-y-3">
            {charts.verificationStatus.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-700 capitalize">{item.status || "Unverified"}</p>
                  <p className="text-sm font-semibold text-slate-900">{item.count}</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition ${
                      item.status === "VERIFIED"
                        ? "bg-green-500"
                        : item.status === "PENDING"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${(item.count / Math.max(...charts.verificationStatus.map((c) => c.count), 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Status Distribution Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clipboard size={20} className="text-slate-900" />
            <h3 className="font-bold text-slate-900">Profile Status</h3>
          </div>
          <div className="space-y-3">
            {charts.profileStatusDistribution.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-700 capitalize">
                    {item.status
                      ?.replace(/_/g, " ")
                      .toLowerCase()
                      .split(" ")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ") || "Unknown"}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{item.count}</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition ${
                      item.status === "APPROVED"
                        ? "bg-green-500"
                        : item.status === "PENDING_APPROVAL"
                        ? "bg-blue-500"
                        : item.status === "REJECTED"
                        ? "bg-red-500"
                        : "bg-slate-400"
                    }`}
                    style={{
                      width: `${(item.count / Math.max(...charts.profileStatusDistribution.map((c) => c.count), 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Status Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-slate-900" />
            <h3 className="font-bold text-slate-900">User Status</h3>
          </div>
          <div className="space-y-3">
            {charts.userStatus.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-700 capitalize">{item.status || "Unknown"}</p>
                  <p className="text-sm font-semibold text-slate-900">{item.count}</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition ${
                      item.status === "ACTIVE"
                        ? "bg-green-500"
                        : item.status === "SUSPENDED"
                        ? "bg-yellow-500"
                        : item.status === "BANNED"
                        ? "bg-red-500"
                        : "bg-slate-400"
                    }`}
                    style={{
                      width: `${(item.count / Math.max(...charts.userStatus.map((c) => c.count), 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      {(() => {
        const growthData = charts.userGrowth.slice(-7);
        const growthLabel = growthData.length > 0 ? `User Growth (Last ${growthData.length} Day${growthData.length !== 1 ? "s" : ""})` : "User Growth";
        return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-slate-900" />
          <h3 className="font-bold text-slate-900">{growthLabel}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-slate-600 font-semibold">Date</th>
                <th className="text-right py-2 px-3 text-slate-600 font-semibold">New Users</th>
                <th className="text-right py-2 px-3 text-slate-600 font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody>
              {growthData.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-3 text-slate-900 font-semibold">
                    {new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-900 font-semibold">{item.count}</td>
                  <td className="py-3 px-3">
                    <div className="w-32 bg-slate-200 rounded h-2">
                      <div
                        className="bg-[#d4af37] h-2 rounded transition"
                        style={{
                          width: `${(item.count / Math.max(...charts.userGrowth.map((c) => c.count), 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">Showing last {growthData.length} day{growthData.length !== 1 ? "s" : ""} of data</p>
      </div>
        );
      })()}
    </AdminLayout>
  );
}
