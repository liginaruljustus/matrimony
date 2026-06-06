"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";

type ProfileDetail = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userProfileId: string;
  profileType: string;
  profileStatus: string;
  contentScore: number;
  photos: string[];
  // Personal Details
  age: number;
  religion: string;
  caste: string;
  location: string;
  education: string;
  income: number;
  bio: string;
  // Other fields
  rejectionReason?: string;
  flaggedReason?: string;
  moderationNotes?: string;
  createdAt: string;
};

export default function AdminProfileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    profileStatus: "",
    contentScore: 0,
    rejectionReason: "",
    flaggedReason: "",
    moderationNotes: "",
  });

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/profiles/${profileId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data.profile);
      setFormData({
        profileStatus: data.profile.profileStatus,
        contentScore: data.profile.contentScore || 0,
        rejectionReason: data.profile.rejectionReason || "",
        flaggedReason: data.profile.flaggedReason || "",
        moderationNotes: data.profile.moderationNotes || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/profiles/${profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      alert("Profile updated successfully");
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#d4af37] border-t-[#7a1f2b] rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <AdminHeader title="Profile Not Found" description="" />
        <div className="text-center py-12">
          <p className="text-slate-500">This profile does not exist</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-[#d4af37] text-[#7a1f2b] font-semibold rounded-lg hover:bg-[#c9a32e]"
          >
            Go Back
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <button
        onClick={() => router.back()}
        className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded transition mb-4"
      >
        ← Back
      </button>

      <AdminHeader title={profile.userName} description={`Profile ID: ${profile.id}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          {profile.photos && profile.photos.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Profile Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {profile.photos.map((photo, i) => (
                  <div
                    key={i}
                    className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#d4af37] transition"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Profile Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Age", value: profile.age },
                { label: "Religion", value: profile.religion },
                { label: "Caste", value: profile.caste },
                { label: "Location", value: profile.location },
                { label: "Education", value: profile.education },
                { label: "Income (₹)", value: profile.income?.toLocaleString("en-IN") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-500 font-semibold">{label}</p>
                  <p className="text-sm text-slate-900 font-semibold">{value || "—"}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-slate-500 font-semibold">Type</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Users size={16} />
                  {profile.profileType === "BRIDE" ? "Bride" : profile.profileType === "GROOM" ? "Groom" : "—"}
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 font-semibold mb-1">Bio</p>
                <p className="text-sm text-slate-700">{profile.bio}</p>
              </div>
            )}
          </div>

          {/* User Link */}
          <Link
            href={`/admin/users/${profile.userId}`}
            className="block bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition"
          >
            <p className="text-xs text-slate-500 font-semibold">View User Account</p>
            <p className="text-sm font-semibold text-[#7a1f2b]">{profile.userName} ({profile.userProfileId})</p>
          </Link>
        </div>

        {/* Right Column - Moderation */}
        <div className="lg:col-span-1 space-y-4">
          {/* Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Status</h3>
            <StatusBadge status={profile.profileStatus} type="profile" />

            {profile.rejectionReason && (
              <div className="mt-3 p-3 bg-red-50 rounded">
                <p className="text-xs text-red-700 font-semibold">Rejection Reason</p>
                <p className="text-xs text-red-600 mt-1">{profile.rejectionReason}</p>
              </div>
            )}

            {profile.flaggedReason && (
              <div className="mt-3 p-3 bg-orange-50 rounded">
                <p className="text-xs text-orange-700 font-semibold">Flag Reason</p>
                <p className="text-xs text-orange-600 mt-1">{profile.flaggedReason}</p>
              </div>
            )}
          </div>

          {/* Edit Form */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Moderation</h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 bg-[#d4af37] text-[#7a1f2b] text-sm font-semibold rounded-lg hover:bg-[#c9a32e]"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-2">Profile Status</label>
                <select
                  value={formData.profileStatus}
                  onChange={(e) => setFormData({ ...formData, profileStatus: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="FLAGGED">Flagged</option>
                </select>
              </div>

              {/* Content Score */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-2">
                  Content Score: {formData.contentScore}/100
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.contentScore}
                  onChange={(e) => setFormData({ ...formData, contentScore: Number(e.target.value) })}
                  disabled={!editing}
                  className="w-full disabled:opacity-50"
                />
              </div>

              {/* Rejection Reason */}
              {formData.profileStatus === "REJECTED" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-2">Rejection Reason</label>
                  <textarea
                    value={formData.rejectionReason}
                    onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 resize-none"
                    rows={2}
                  />
                </div>
              )}

              {/* Flag Reason */}
              {formData.profileStatus === "FLAGGED" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-2">Flag Reason</label>
                  <textarea
                    value={formData.flaggedReason}
                    onChange={(e) => setFormData({ ...formData, flaggedReason: e.target.value })}
                    disabled={!editing}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 resize-none"
                    rows={2}
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-2">Moderation Notes</label>
                <textarea
                  value={formData.moderationNotes}
                  onChange={(e) => setFormData({ ...formData, moderationNotes: e.target.value })}
                  disabled={!editing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 resize-none"
                  rows={3}
                  placeholder="Add notes about your review..."
                />
              </div>

              {/* Actions */}
              {editing && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadProfile();
                    }}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-2xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Preview" className="w-full h-auto rounded-lg" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 px-3 py-1.5 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
