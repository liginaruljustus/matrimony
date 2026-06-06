"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { profileSchema } from "@/lib/validators";
import { upsertProfileAction, deleteProfileAction } from "@/app/actions/profileActions";
import { z } from "zod";

type FormData = z.input<typeof profileSchema>;

type DefaultProfile = {
  age: number;
  religion: string;
  caste: string;
  location: string;
  education: string;
  income: number;
  bio?: string;
  photos: string[];
};

type Props = {
  defaultProfile?: DefaultProfile | null;
};

export function ProfileForm({ defaultProfile }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [photos, setPhotos] = useState<string[]>(defaultProfile?.photos ?? []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultProfile
      ? {
          age: defaultProfile.age,
          religion: defaultProfile.religion,
          caste: defaultProfile.caste,
          location: defaultProfile.location,
          education: defaultProfile.education,
          income: defaultProfile.income,
          bio: defaultProfile.bio ?? "",
        }
      : { age: 25, religion: "", caste: "", location: "", education: "", income: 1000000, bio: "" },
  });

  const onSubmit = (values: FormData) => {
    startTransition(async () => {
      const res = await upsertProfileAction(profileSchema.parse(values));
      setMessage({ text: res.message, ok: res.ok });
    });
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setMessage(null);
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch("/api/photos", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) {
      setPhotos((prev) => [...prev, data.url as string]);
      setMessage({ text: "Photo uploaded", ok: true });
    } else {
      setMessage({ text: (data.message as string) ?? "Upload failed", ok: false });
    }
    setUploadingPhoto(false);
    e.target.value = "";
  };

  const removePhoto = async (url: string) => {
    const res = await fetch("/api/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p !== url));
      setMessage({ text: "Photo removed", ok: true });
    }
  };

  const handleDelete = () => {
    if (!confirm("Delete your profile permanently? This cannot be undone.")) return;
    startDeleteTransition(async () => {
      const res = await deleteProfileAction();
      if (res.ok) router.push("/");
      else setMessage({ text: res.message, ok: false });
    });
  };

  const inputCls =
    "w-full rounded-[var(--radius-lg)] border border-neutral-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-fast";
  const labelCls = "block text-xs font-medium text-text-secondary mb-1";

  const fieldError =
    errors.age?.message ??
    errors.religion?.message ??
    errors.caste?.message ??
    errors.location?.message ??
    errors.education?.message ??
    errors.income?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Profile details */}
      <div className="rounded-[var(--radius-2xl)] bg-white p-4 shadow-base border border-neutral-100">
        <h2 className="mb-4 text-base font-semibold text-primary">
          {defaultProfile ? "Edit Profile" : "Create Profile"}
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Age</label>
            <input {...register("age")} type="number" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Religion</label>
            <input {...register("religion")} className={inputCls} placeholder="e.g. Hindu" />
          </div>
          <div>
            <label className={labelCls}>Caste / Community</label>
            <input {...register("caste")} className={inputCls} placeholder="e.g. Mudaliar" />
          </div>
          <div>
            <label className={labelCls}>Location / District</label>
            <input {...register("location")} className={inputCls} placeholder="e.g. Chennai" />
          </div>
          <div>
            <label className={labelCls}>Education</label>
            <input {...register("education")} className={inputCls} placeholder="e.g. B.E Computer Science" />
          </div>
          <div>
            <label className={labelCls}>Annual Income (₹)</label>
            <input {...register("income")} type="number" className={inputCls} />
          </div>
        </div>

        <div className="mt-3">
          <label className={labelCls}>Bio</label>
          <textarea
            {...register("bio")}
            rows={3}
            className={inputCls}
            placeholder="Tell families a little about yourself..."
          />
        </div>

        {fieldError && <p className="mt-2 text-xs text-error">{fieldError}</p>}
      </div>

      {/* Photo management */}
      <div className="rounded-[var(--radius-2xl)] bg-white p-4 shadow-base border border-neutral-100">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-primary">Profile Photos</h3>
            <p className="text-xs text-text-tertiary">{photos.length}/6 — first photo is your main picture</p>
          </div>
          {photos.length < 6 && (
            <label className="cursor-pointer rounded-[var(--radius-lg)] bg-accent px-3 py-2 text-xs font-bold text-white transition-fast hover:shadow-md">
              {uploadingPhoto ? "Uploading..." : "+ Add Photo"}
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={uploadPhoto}
                disabled={uploadingPhoto}
              />
            </label>
          )}
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {photos.map((url, i) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-[var(--radius-lg)]">
                <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white opacity-0 shadow-base transition-fast group-hover:opacity-100"
                >
                  ×
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-[var(--radius-sm)] bg-primary/80 px-1 py-0.5 text-[8px] font-bold text-white">
                    MAIN
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-neutral-200 py-6 text-center">
            <p className="text-xs text-text-tertiary">No photos yet. Add your first photo above.</p>
          </div>
        )}
      </div>

      {/* Status message */}
      {message && (
        <p className={`text-sm font-medium ${message.ok ? "text-success" : "text-error"}`}>{message.text}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-[var(--radius-lg)] bg-primary px-4 py-3 text-sm font-semibold text-white transition-fast hover:shadow-md disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Profile"}
        </button>
        {defaultProfile && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-[var(--radius-lg)] border border-error/30 px-4 py-3 text-sm font-semibold text-error transition-fast hover:bg-error/5 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Profile"}
          </button>
        )}
      </div>
    </form>
  );
}
