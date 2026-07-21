"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Settings2,
  ToggleLeft,
  Smartphone,
  Snowflake,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  ShieldAlert,
  TriangleAlert,
  ChevronRight,
  Loader2,
  FileText,
  Heart,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

type Settings = {
  paymentAmounts: { MC: number; UC: number; EC: number };
  maintenanceMode: boolean;
  maintenanceMessage: string;
  registrationOpen: boolean;
  emailNotifications: boolean;
  profileApprovalRequired: boolean;
  contactDetailsGating: boolean;
  paymentRequired: boolean;
  verificationRequired: boolean;
  // Payment collection details
  upiId: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankAccountHolder: string;
  // Auto-freeze thresholds
  groomFreezeDays: number;
  brideFreezeDays: number;
  // PDF document settings
  pdfDownloadEnabled: boolean;
  pdfCompanyName: string;
  pdfFooterText: string;
  pdfShowContactDetails: boolean;
  pdfShowAstrology: boolean;
  paymentLockDays: number;
  inboxFreezeDays: number;
  firstPaymentAutoApproveDays: number;
  secondPaymentAutoApproveDays: number;
};

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

// ─── Reusable sub-components ─────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">{children}</div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon size={18} className="text-slate-500" />
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="font-medium text-sm text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer shrink-0 ml-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#d4af37] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37]" />
      </label>
    </div>
  );
}

function NumberInput({
  label,
  description,
  value,
  prefix,
  suffix,
  min,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  prefix?: string;
  suffix?: string;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-900 mb-1">{label}</label>
      {description && <p className="text-xs text-slate-500 mb-2">{description}</p>}
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-slate-500 shrink-0">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={min ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
        />
        {suffix && <span className="text-sm text-slate-500 shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

function TextInput({
  label,
  description,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-900 mb-1">{label}</label>
      {description && <p className="text-xs text-slate-500 mb-2">{description}</p>}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved,    setSaved]    = useState<Settings | null>(null); // snapshot after last save
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const toast = useToast();

  // ── Danger Zone state ─────────────────────────────────────────────────────
  type ResetType = "activity" | "profiles" | "users" | "factory";
  type ModalStep = "confirm" | "executing" | "done";

  const [dangerModal, setDangerModal] = useState<{
    type: ResetType;
    step: ModalStep;
    preview: Record<string, number> | null;
    loadingPreview: boolean;
    confirmText: string;
    result: Record<string, number> | null;
    error: string;
  } | null>(null);

  const RESET_META: Record<ResetType, {
    label: string;
    phrase: string;
    color: string;
    bg: string;
    description: string;
    details: string[];
  }> = {
    activity: {
      label:       "Clear Activity Data",
      phrase:      "DELETE ACTIVITY",
      color:       "text-amber-700",
      bg:          "bg-amber-50 border-amber-200",
      description: "Removes all transactional records. Users and profiles are kept.",
      details: [
        "Favorites & interests",
        "Payments",
        "Messages & conversations",
        "Terms acceptance",
        "Reports",
        "Audit logs",
        "Pending OTP records",
      ],
    },
    profiles: {
      label:       "Clear All Profiles",
      phrase:      "DELETE PROFILES",
      color:       "text-orange-700",
      bg:          "bg-orange-50 border-orange-200",
      description: "Removes all profile data and Cloudinary photos. Includes all activity data.",
      details: [
        "Everything in Clear Activity",
        "All profile documents",
        "All Cloudinary photos",
        "Profile fields reset on user accounts",
      ],
    },
    users: {
      label:       "Clear All Users",
      phrase:      "DELETE USERS",
      color:       "text-red-700",
      bg:          "bg-red-50 border-red-200",
      description: "Deletes all non-admin user accounts. Includes profiles and activity.",
      details: [
        "Everything in Clear Profiles",
        "All non-admin user accounts",
        "Admin accounts are preserved",
      ],
    },
    factory: {
      label:       "Factory Reset",
      phrase:      "FACTORY RESET",
      color:       "text-rose-700",
      bg:          "bg-rose-50 border-rose-200",
      description: "Full wipe: users, profiles, activity + resets settings to defaults.",
      details: [
        "Everything in Clear All Users",
        "Resets all settings to factory defaults",
        "Admin accounts are the only thing preserved",
      ],
    },
  };

  const openDangerModal = async (type: ResetType) => {
    setDangerModal({ type, step: "confirm", preview: null, loadingPreview: true, confirmText: "", result: null, error: "" });
    try {
      const res  = await fetch(`/api/admin/danger/preview?type=${type}`);
      const data = await res.json();
      setDangerModal((m) => m ? { ...m, loadingPreview: false, preview: data.counts } : m);
    } catch {
      setDangerModal((m) => m ? { ...m, loadingPreview: false } : m);
    }
  };

  const executeDangerReset = async () => {
    if (!dangerModal) return;
    const { type } = dangerModal;
    setDangerModal((m) => m ? { ...m, step: "executing", error: "" } : m);
    try {
      const res  = await fetch("/api/admin/danger/reset", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type, confirm: RESET_META[type].phrase }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDangerModal((m) => m ? { ...m, step: "confirm", error: data.error ?? "Reset failed." } : m);
        return;
      }
      setDangerModal((m) => m ? { ...m, step: "done", result: data.deleted } : m);
      // Reload settings in case factory reset changed them
      if (type === "factory") await loadSettings();
    } catch {
      setDangerModal((m) => m ? { ...m, step: "confirm", error: "Network error. Please try again." } : m);
    }
  };

  const isDirty = settings && saved
    ? JSON.stringify(settings) !== JSON.stringify(saved)
    : false;

  // Warn on browser/tab close when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data: Settings = await res.json();
      setSettings(data);
      setSaved(data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load settings — showing defaults");
      const defaults: Settings = {
        paymentAmounts: { MC: 500, UC: 2500, EC: 5000 },
        maintenanceMode: false,
        maintenanceMessage: "",
        registrationOpen: true,
        emailNotifications: true,
        profileApprovalRequired: false,
        contactDetailsGating: true,
        paymentRequired: true,
        verificationRequired: false,
        upiId: "luramatrimony@upi",
        bankName: "State Bank of India",
        bankAccountNo: "",
        bankIfsc: "",
        bankAccountHolder: "Lura Matrimony Services",
        groomFreezeDays: 90,
        brideFreezeDays: 60,
        pdfDownloadEnabled: true,
        pdfCompanyName: "Lura Matrimony",
        pdfFooterText: "Confidential — For Family Use Only",
        pdfShowContactDetails: true,
        pdfShowAstrology: true,
        paymentLockDays: 3,
        inboxFreezeDays: 30,
        firstPaymentAutoApproveDays: 7,
        secondPaymentAutoApproveDays: 30,
      };
      setSettings(defaults);
      setSaved(defaults);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(JSON.parse(JSON.stringify(settings)));
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings — please try again");
    } finally {
      setSaving(false);
    }
  };

  // ── Discard changes ───────────────────────────────────────────────────────
  const handleDiscard = () => {
    if (saved) setSettings(structuredClone(saved));
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => s ? { ...s, [key]: value } : s);

  const setAmt = (cls: "MC" | "UC" | "EC", v: number) =>
    setSettings((s) =>
      s ? { ...s, paymentAmounts: { ...s.paymentAmounts, [cls]: v } } : s
    );

  // ─────────────────────────────────────────────────────────────────────────

  if (loading || !settings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#d4af37] border-t-[#7a1f2b] rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto transition-all ${
              t.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle size={16} className="text-green-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            {t.message}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ml-2 text-current opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <AdminHeader
        title="System Settings"
        description="Configure platform settings and feature flags"
      />

      <div className="space-y-6 max-w-4xl">

        {/* ── Payment Amounts ────────────────────────────────────────────── */}
        <SectionCard>
          <SectionTitle icon={CreditCard} title="Payment Amounts" />
          <div className="grid grid-cols-3 gap-4">
            <NumberInput
              label="MC Family"
              value={settings.paymentAmounts.MC}
              prefix="₹"
              min={0}
              onChange={(v) => setAmt("MC", v)}
            />
            <NumberInput
              label="UC Family"
              value={settings.paymentAmounts.UC}
              prefix="₹"
              min={0}
              onChange={(v) => setAmt("UC", v)}
            />
            <NumberInput
              label="EC Family"
              value={settings.paymentAmounts.EC}
              prefix="₹"
              min={0}
              onChange={(v) => setAmt("EC", v)}
            />
          </div>
        </SectionCard>

        {/* ── Payment Collection Details ─────────────────────────────────── */}
        <SectionCard>
          <SectionTitle icon={Smartphone} title="Payment Collection Details" />
          <p className="text-xs text-slate-500 mb-4 -mt-2">
            Shown to users on the payment page when submitting transactions.
          </p>
          <div className="space-y-4">
            <TextInput
              label="UPI ID"
              value={settings.upiId}
              placeholder="example@upi"
              onChange={(v) => set("upiId", v)}
            />
            <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
              <TextInput
                label="Bank Name"
                value={settings.bankName}
                placeholder="State Bank of India"
                onChange={(v) => set("bankName", v)}
              />
              <TextInput
                label="Account Holder"
                value={settings.bankAccountHolder}
                placeholder="Full name"
                onChange={(v) => set("bankAccountHolder", v)}
              />
              <TextInput
                label="Account Number"
                value={settings.bankAccountNo}
                placeholder="••••••••••"
                onChange={(v) => set("bankAccountNo", v)}
              />
              <TextInput
                label="IFSC Code"
                value={settings.bankIfsc}
                placeholder="SBIN0000000"
                onChange={(v) => set("bankIfsc", v)}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── System Configuration ───────────────────────────────────────── */}
        <SectionCard>
          <SectionTitle icon={Settings2} title="System Configuration" />
          <div className="space-y-5 divide-y divide-slate-100">
            <div className="pb-2">
              <Toggle
                checked={settings.maintenanceMode}
                onChange={(v) => set("maintenanceMode", v)}
                label="Maintenance Mode"
                description="Show a maintenance message to all users"
              />
              {settings.maintenanceMode && (
                <div className="mt-3">
                  <textarea
                    value={settings.maintenanceMessage}
                    onChange={(e) => set("maintenanceMessage", e.target.value)}
                    placeholder="Message shown to users during maintenance…"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  />
                </div>
              )}
            </div>
            <div className="pt-3">
              <Toggle
                checked={settings.registrationOpen}
                onChange={(v) => set("registrationOpen", v)}
                label="Registration Open"
                description="Allow new users to register"
              />
            </div>
            <div className="pt-3">
              <Toggle
                checked={settings.emailNotifications}
                onChange={(v) => set("emailNotifications", v)}
                label="Email Notifications"
                description="Send automated emails to users"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Feature Flags ──────────────────────────────────────────────── */}
        <SectionCard>
          <SectionTitle icon={ToggleLeft} title="Feature Flags" />
          <div className="space-y-5 divide-y divide-slate-100">
            <div className="pb-2">
              <Toggle
                checked={settings.profileApprovalRequired}
                onChange={(v) => set("profileApprovalRequired", v)}
                label="Profile Approval Required"
                description="Profiles must be reviewed by admin before going live"
              />
            </div>
            <div className="pt-3">
              <Toggle
                checked={settings.verificationRequired}
                onChange={(v) => set("verificationRequired", v)}
                label="Verification Required"
                description="Users must upload verification documents"
              />
            </div>
            <div className="pt-3">
              <Toggle
                checked={settings.contactDetailsGating}
                onChange={(v) => set("contactDetailsGating", v)}
                label="Contact Details Gating"
                description="Require 2nd payment to view contact numbers"
              />
            </div>
            <div className="pt-3">
              <Toggle
                checked={settings.paymentRequired}
                onChange={(v) => set("paymentRequired", v)}
                label="Payment Required"
                description="Require payment to unlock inbox and contact details"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Auto-Freeze Thresholds ─────────────────────────────────────── */}
        <SectionCard>
          <SectionTitle icon={Snowflake} title="Auto-Freeze Thresholds" />
          <p className="text-xs text-slate-500 mb-4 -mt-2">
            Profiles inactive for this many days are automatically frozen by the nightly cron job.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <NumberInput
              label="Groom Inactivity"
              description="Default: 90 days"
              value={settings.groomFreezeDays}
              suffix="days"
              min={1}
              onChange={(v) => set("groomFreezeDays", v)}
            />
            <NumberInput
              label="Bride Inactivity"
              description="Default: 60 days"
              value={settings.brideFreezeDays}
              suffix="days"
              min={1}
              onChange={(v) => set("brideFreezeDays", v)}
            />
          </div>
        </SectionCard>

        {/* ── PDF Document Settings ──────────────────────────────────────── */}
        <SectionCard>
          <SectionTitle icon={FileText} title="PDF Document Settings" />
          <p className="text-xs text-slate-500 mb-4 -mt-2">
            Controls the content and availability of downloadable profile PDFs.
          </p>
          <div className="space-y-5 divide-y divide-slate-100">
            <div className="pb-2">
              <Toggle
                checked={settings.pdfDownloadEnabled}
                onChange={(v) => set("pdfDownloadEnabled", v)}
                label="Allow PDF Download"
                description="Users can download their profile as a PDF from My Profile"
              />
            </div>
            <div className="pt-4 pb-2 space-y-4">
              <TextInput
                label="Company Name"
                description="Shown in the PDF header and footer branding"
                value={settings.pdfCompanyName}
                placeholder="Lura Matrimony"
                onChange={(v) => set("pdfCompanyName", v)}
              />
              <TextInput
                label="Footer Confidential Text"
                description="Small text printed at the bottom of every PDF page"
                value={settings.pdfFooterText}
                placeholder="Confidential — For Family Use Only"
                onChange={(v) => set("pdfFooterText", v)}
              />
            </div>
            <div className="pt-3 space-y-3">
              <Toggle
                checked={settings.pdfShowContactDetails}
                onChange={(v) => set("pdfShowContactDetails", v)}
                label="Include Contact Details"
                description="Show contact person name, phone, and WhatsApp in the PDF"
              />
              <Toggle
                checked={settings.pdfShowAstrology}
                onChange={(v) => set("pdfShowAstrology", v)}
                label="Include Astrology Section"
                description="Show Rashi, Nakshatra, Lagnam, and birth details in the PDF"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Favorites & Payment Timing ─────────────────────────────────── */}
        <SectionCard>
          <SectionTitle icon={Heart} title="Favorites & Payment Timing" />
          <p className="text-xs text-slate-500 mb-4 -mt-2">
            Favorites are never automatically removed. These settings only control
            payment windows and inbox timing.
          </p>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-900">Payment Lock Period (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.paymentLockDays}
                onChange={(e) => set("paymentLockDays", Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
              />
              <p className="text-xs text-slate-500 mt-1">
                After a groom moves a favorite to payment, this many days is shown as the payment window. If it passes unpaid, the favorite simply becomes payable again — it is never removed.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-900">Inbox Waiting Period (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.inboxFreezeDays}
                onChange={(e) => set("inboxFreezeDays", Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
              />
              <p className="text-xs text-slate-500 mt-1">
                After the 1st payment is approved, the bride&apos;s additional details — and her accept/decline response — stay locked in the groom&apos;s inbox for this many days (only her Profile ID is shown). A decline still shows immediately; only an accept is held back.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-900">1st Payment Auto-Approval (Days)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.firstPaymentAutoApproveDays}
                onChange={(e) => set("firstPaymentAutoApproveDays", Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
              />
              <p className="text-xs text-slate-500 mt-1">
                Admin should manually verify the transaction and approve the 1st payment. If nobody reviews it within this many days, the system approves it automatically so the proposal isn&apos;t stuck — check the payments list regularly for unreviewed transactions.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-900">2nd Payment Auto-Approval (Days)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={settings.secondPaymentAutoApproveDays}
                onChange={(e) => set("secondPaymentAutoApproveDays", Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]/30"
              />
              <p className="text-xs text-slate-500 mt-1">
                Same safety net for the 2nd payment (contact details). If admin hasn&apos;t reviewed it within this many days, it is approved automatically.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── Danger Zone ────────────────────────────────────────────────── */}
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={18} className="text-red-600" />
            <h3 className="font-bold text-red-900">Danger Zone</h3>
          </div>
          <p className="text-xs text-red-600 mb-5">
            These actions are permanent and cannot be undone. Admin accounts and platform settings are always preserved.
          </p>

          <div className="space-y-3">
            {(["activity", "profiles", "users", "factory"] as const).map((type) => {
              const meta = RESET_META[type];
              return (
                <div
                  key={type}
                  className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${meta.bg}`}
                >
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm ${meta.color}`}>{meta.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{meta.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDangerModal(type)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition hover:opacity-80 ${meta.color} border-current bg-white`}
                  >
                    <Trash2 size={12} />
                    {meta.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Save bar ───────────────────────────────────────────────────── */}
        <div
          className={`flex items-center gap-3 rounded-lg p-4 transition-colors ${
            isDirty ? "bg-amber-50 border border-amber-200" : "bg-slate-50 border border-slate-200"
          }`}
        >
          {isDirty && (
            <p className="text-sm text-amber-700 font-medium flex-1">
              You have unsaved changes.
            </p>
          )}
          {!isDirty && (
            <p className="text-sm text-slate-500 flex-1">All changes saved.</p>
          )}
          {isDirty && (
            <button
              onClick={handleDiscard}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-6 py-2 bg-[#d4af37] text-[#7a1f2b] text-sm font-bold rounded-lg hover:bg-[#c9a32e] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
      {/* ── Danger Zone Modal ──────────────────────────────────────────────── */}
      {dangerModal && (() => {
        const meta = RESET_META[dangerModal.type];
        const phraseOk = dangerModal.confirmText.trim() === meta.phrase;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

              {/* ── Header ── */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${meta.bg}`}>
                <div className="flex items-center gap-2">
                  <TriangleAlert size={18} className={meta.color} />
                  <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                </div>
                {dangerModal.step !== "executing" && (
                  <button
                    onClick={() => setDangerModal(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="p-6 space-y-5">

                {/* ── CONFIRM step ── */}
                {dangerModal.step === "confirm" && (
                  <>
                    {/* What will be deleted */}
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                        This will permanently delete:
                      </p>
                      <ul className="space-y-1">
                        {meta.details.map((d) => (
                          <li key={d} className="flex items-center gap-2 text-sm text-neutral-700">
                            <ChevronRight size={12} className={`shrink-0 ${meta.color}`} />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Live counts from preview */}
                    {dangerModal.loadingPreview ? (
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Loader2 size={14} className="animate-spin" />
                        Loading current counts…
                      </div>
                    ) : dangerModal.preview ? (
                      <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                        <p className="text-xs font-semibold text-neutral-500 mb-2">Current record counts</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(dangerModal.preview).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-xs">
                              <span className="text-neutral-500 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                              <span className="font-bold text-neutral-800">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Confirmation phrase input */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Type <span className={`font-mono font-bold ${meta.color}`}>{meta.phrase}</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={dangerModal.confirmText}
                        onChange={(e) => setDangerModal((m) => m ? { ...m, confirmText: e.target.value, error: "" } : m)}
                        placeholder={meta.phrase}
                        className={`w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none transition focus:ring-2 ${
                          phraseOk
                            ? "border-green-400 focus:ring-green-200"
                            : "border-neutral-300 focus:ring-neutral-200"
                        }`}
                      />
                    </div>

                    {/* Error */}
                    {dangerModal.error && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700">
                        <AlertCircle size={14} className="shrink-0" />
                        {dangerModal.error}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => setDangerModal(null)}
                        className="flex-1 rounded-lg border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={executeDangerReset}
                        disabled={!phraseOk}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${
                          dangerModal.type === "factory"
                            ? "bg-rose-600 hover:bg-rose-700"
                            : dangerModal.type === "users"
                            ? "bg-red-600 hover:bg-red-700"
                            : dangerModal.type === "profiles"
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "bg-amber-600 hover:bg-amber-700"
                        }`}
                      >
                        <Trash2 size={14} />
                        Confirm Delete
                      </button>
                    </div>
                  </>
                )}

                {/* ── EXECUTING step ── */}
                {dangerModal.step === "executing" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <Loader2 size={36} className={`animate-spin ${meta.color}`} />
                    <p className="font-semibold text-neutral-800">Deleting records…</p>
                    <p className="text-xs text-neutral-500 text-center">
                      Please wait. Do not close this window.
                    </p>
                  </div>
                )}

                {/* ── DONE step ── */}
                {dangerModal.step === "done" && dangerModal.result && (
                  <>
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle size={28} className="text-green-600" />
                      </div>
                      <p className="font-bold text-neutral-900">Reset complete</p>
                    </div>

                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                      <p className="text-xs font-semibold text-neutral-500 mb-2">Records deleted</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(dangerModal.result).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs">
                            <span className="text-neutral-500 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                            <span className="font-bold text-green-700">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setDangerModal(null)}
                      className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-bold text-white hover:bg-neutral-700 transition"
                    >
                      Close
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
        );
      })()}

    </AdminLayout>
  );
}
