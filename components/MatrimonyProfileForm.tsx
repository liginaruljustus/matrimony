"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { SearchDropdown } from "@/components/SearchDropdown";
import { DatePickerSelect } from "@/components/DatePickerSelect";
import { PhoneInput } from "@/components/PhoneInput";
import { CASTE_LIST, SUBCASTE_LIST } from "@/lib/casteData";
import { zodResolver } from "@hookform/resolvers/zod";
import { matrimonyProfileSchema } from "@/lib/validators";
import { z } from "zod";
import { updateMatrimonyProfileAction } from "@/app/actions/profileActions";
import Image from "next/image";
import { X, ImagePlus, AlertCircle, CheckCircle } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  name: "Full Name", gender: "Gender", age: "Age", dateOfBirth: "Date of Birth",
  maritalStatus: "Marital Status", nativeDistrict: "Native District",
  religion: "Religion", caste: "Caste", subCaste: "Sub Caste",
  education: "Education", address: "Address", motherTongue: "Mother Tongue",
  height: "Height", complexion: "Complexion", currentJob: "Current Job",
  monthlyIncome: "Monthly Income", placeOfBirth: "Place of Birth",
  timeOfBirth: "Time of Birth", rashi: "Rashi", nakshatra: "Nakshatra",
  lagnam: "Lagnam", fatherName: "Father's Name", fatherOccupation: "Father's Occupation",
  motherName: "Mother's Name", motherOccupation: "Mother's Occupation",
  totalBrothers: "Total Brothers", marriedBrothers: "Married Brothers",
  totalSisters: "Total Sisters", marriedSisters: "Married Sisters",
  houseDetails: "House Details", familyStatus: "Family Status",
  contactPersonName: "Contact Person Name", contactNumber: "Contact Number",
  whatsappNo: "WhatsApp Number", emailId: "Email ID", bio: "Bio / About Me",
};

// Derive the form type directly from the Zod schema so the resolver types always match
type FormData = z.infer<typeof matrimonyProfileSchema>;

const STEPS = [
  "Personal Details",
  "Family Details",
  "Contact Details",
  "Photos & Expectations",
  "Review",
];

const DISTRICTS = [
  // Pinned first
  "Puducherry",
  "Karaikal",
  // Remaining districts, alphabetically sorted
  ...[
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
    "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
    "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
    "Ramanathapuram", "Ranipet", "Salem", "Sivagangai", "Tenkasi",
    "Thanjavur", "Theni", "Thiruvallur", "Thiruvarur", "Thoothukudi",
    "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai",
    "Trichy", "Vellore", "Villupuram", "Virudhunagar",
  ].sort((a, b) => a.localeCompare(b)),
];

const RASHI_LIST = [
  "Aries / மேஷம்",
  "Taurus / ரிஷபம்",
  "Gemini / மிதுனம்",
  "Cancer / கடகம்",
  "Leo / சிம்மம்",
  "Virgo / கன்னி",
  "Libra / துலாம்",
  "Scorpio / விருச்சிகம்",
  "Sagittarius / தனுசு",
  "Capricorn / மகரம்",
  "Aquarius / கும்பம்",
  "Pisces / மீனம்",
] as const;

const NAKSHATRA_LIST = [
  "Ashvini / அஸ்வினி",
  "Bharani / பரணி",
  "Karthikai / கார்த்திகை",
  "Rohini / ரோகிணி",
  "Mrigashira / மிருகசீரிடம்",
  "Thiruvathirai / திருவாதிரை",
  "Punarpoosam / புனர்பூசம்",
  "Pusam / பூசம்",
  "Ayilyam / ஆயிலியம்",
  "Magam / மகம்",
  "Puram / பூரம்",
  "Uthram / உத்தரம்",
  "Hastham / அஸ்தம்",
  "Chitrai / சித்திரை",
  "Swati / சுவாதி",
  "Visakam / விசாகம்",
  "Anusham / அனுசம்",
  "Kettai / கேட்டை",
  "Moolam / மூலம்",
  "Pooradam / பூராடம்",
  "Uttaradam / உத்திராடம்",
  "Thiruvonam / திருவோணம்",
  "Avittam / அவிட்டம்",
  "Sadayam / சதயம்",
  "Poorattathi / பூரட்டாதி",
  "Uthirattathi / உத்திரட்டாதி",
  "Revati / ரேவதி",
] as const;

function normalizeProfile(profile: any) {
  if (!profile) return { gender: "MALE", religion: "HINDU", maritalStatus: "SINGLE", familyStatus: "MC" };

  let dateOfBirth = "";
  if (profile.dateOfBirth) {
    const d = new Date(profile.dateOfBirth);
    if (!isNaN(d.getTime())) dateOfBirth = d.toISOString().split("T")[0];
  }

  return {
    ...profile,
    dateOfBirth,
    monthlyIncome: profile.monthlyIncome ?? profile.income,
    physicallyChallenge: profile.physicallyChallenge ? "true" : "",
  };
}

export function MatrimonyProfileForm({ defaultProfile, onSaved }: { defaultProfile?: any; onSaved?: () => void }) {
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>(defaultProfile?.photos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  const onInvalid = (errs: Record<string, any>) => {
    const labels = Object.keys(errs).map((k) => FIELD_LABELS[k] ?? k);
    setMissingFields(labels);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    control,
  } = useForm<FormData>({
    // cast required: @hookform/resolvers bundles its own react-hook-form types causing TS2719
    resolver: zodResolver(matrimonyProfileSchema) as any, // eslint-disable-line
    defaultValues: normalizeProfile(defaultProfile),
  });

  const age = watch("age");
  const dateOfBirth = watch("dateOfBirth");

  // Age is derived automatically from Date of Birth.
  useEffect(() => {
    if (!dateOfBirth) return;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return;
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) years--;
    if (years >= 0 && years !== age) {
      setValue("age", years, { shouldValidate: true });
    }
  }, [dateOfBirth, age, setValue]);

  const pendingData = useRef<FormData | null>(null);

  const onSubmit = async (data: FormData) => {
    // The final submit permanently locks the profile — confirm first.
    pendingData.current = data;
    setConfirmFinalize(true);
  };

  const doFinalize = async () => {
    const data = pendingData.current;
    if (!data) return;
    setConfirmFinalize(false);
    setSaving(true);
    setMessage(null);
    const result = await updateMatrimonyProfileAction({ ...data, photos }, true);
    if (result.ok) {
      setMessage({ text: "Profile submitted & locked 🎉 Contact the admin for any changes.", ok: true });
      onSaved?.();
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setMessage({ text: result.message || "Failed to save profile", ok: false });
    }
    setSaving(false);
  };

  const uploadPhoto = (file: File) => {
    if (photos.length >= 1 || uploadingPhoto) return;

    // Client-side validation with friendly messages
    if (!file.type.startsWith("image/")) {
      setUploadError("That file is not an image. Please choose a JPG, PNG or WEBP photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`Photo is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 5 MB.`);
      return;
    }

    setUploadError("");
    setUploadSuccess(false);
    setUploadingPhoto(true);
    setUploadProgress(0);

    // Instant local preview while uploading
    const preview = URL.createObjectURL(file);
    setUploadPreview(preview);

    const cleanup = () => {
      URL.revokeObjectURL(preview);
      setUploadPreview(null);
      setUploadingPhoto(false);
    };

    const fd = new FormData();
    fd.append("file", file);

    // XMLHttpRequest — fetch() cannot report upload progress
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/photos");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const { url } = JSON.parse(xhr.responseText);
          setPhotos([url]);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 5000);
        } catch {
          setUploadError("Upload finished but something went wrong. Please try again.");
        }
      } else {
        let msg = "Upload failed. Please try again.";
        // /api/photos returns { message }; other routes use { error }
        try {
          const body = JSON.parse(xhr.responseText);
          msg = body.message ?? body.error ?? msg;
        } catch { /* keep default */ }
        setUploadError(msg);
      }
    };
    xhr.onerror = () => {
      cleanup();
      setUploadError("Network error during upload. Check your connection and try again.");
    };
    xhr.send(fd);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadPhoto(file);
    e.target.value = "";
  };

  const handleZoneDragOver = (e: React.DragEvent) => { e.preventDefault(); setDropZoneActive(true); };

  const handleZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadPhoto(file);
  };

  const removePhoto = async (url: string) => {
    const res = await fetch("/api/photos", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ url }),
    });
    if (res.ok) setPhotos([]);
  };

  return (
    <div className="space-y-6">
      {/* Missing Fields Dialog */}
      {missingFields.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-100 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <h2 className="text-base font-bold text-neutral-900">Required Fields Missing</h2>
              </div>
              <button
                type="button"
                onClick={() => setMissingFields([])}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="mb-3 text-sm text-neutral-500">
                Please fill in the following required fields before saving:
              </p>
              <ul className="space-y-1.5 max-h-60 overflow-y-auto">
                {missingFields.map((label) => (
                  <li key={label} className="flex items-center gap-2 text-sm text-red-700">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-neutral-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setMissingFields([])}
                className="w-full rounded-xl bg-[#7a1f2b] py-2.5 text-sm font-semibold text-white hover:bg-[#6b1823] transition-colors"
              >
                OK, Let Me Fix It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-primary">{STEPS[step]}</span>
          <span className="text-slate-500 dark:text-neutral-700">{step + 1} of {STEPS.length}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-neutral-300 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="card p-6 space-y-4">
        {/* Step 1: Personal Details */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Personal Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Name *</label>
                <input {...register("name")} className="input-field" placeholder="Full name" />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Age *</label>
                <input
                  {...register("age", { valueAsNumber: true })}
                  type="number"
                  readOnly
                  tabIndex={-1}
                  placeholder="Auto from Date of Birth"
                  className="input-field bg-slate-100 dark:bg-neutral-200 cursor-not-allowed"
                />
                <p className="mt-1 text-[10px] text-slate-400">Calculated automatically from Date of Birth</p>
                {errors.age && <p className="text-xs text-red-600 mt-1">{errors.age.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Address *</label>
              <input {...register("address")} className="input-field" placeholder="Street address" />
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Gender *</label>
                <select {...register("gender")} className="input-field">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender.message}</p>}
              </div>
              <div>
                <label className="label">Marital Status *</label>
                <select {...register("maritalStatus")} className="input-field">
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="SEPARATED">Separated</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
                {errors.maritalStatus && <p className="text-xs text-red-600 mt-1">{errors.maritalStatus.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date of Birth *</label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <DatePickerSelect value={field.value ?? ""} onChange={field.onChange} />
                  )}
                />
                {errors.dateOfBirth && <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth.message as string}</p>}
              </div>
              <div>
                <label className="label">Native District *</label>
                <select {...register("nativeDistrict")} className="input-field">
                  <option value="">Select District</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.nativeDistrict && <p className="text-xs text-red-600 mt-1">{errors.nativeDistrict.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Religion *</label>
                <select {...register("religion")} className="input-field">
                  <option value="HINDU">Hindu</option>
                  <option value="MUSLIM">Muslim</option>
                  <option value="CHRISTIAN">Christian</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.religion && <p className="text-xs text-red-600 mt-1">{errors.religion.message}</p>}
              </div>
              <div>
                <label className="label">Caste *</label>
                <Controller
                  name="caste"
                  control={control}
                  render={({ field }) => (
                    <SearchDropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={CASTE_LIST}
                      placeholder="Type or search caste…"
                    />
                  )}
                />
                {errors.caste && <p className="text-xs text-red-600 mt-1">{errors.caste.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Sub Caste</label>
                <Controller
                  name="subCaste"
                  control={control}
                  render={({ field }) => (
                    <SearchDropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={SUBCASTE_LIST}
                      placeholder="Type or search sub caste…"
                    />
                  )}
                />
                {errors.subCaste && <p className="text-xs text-red-600 mt-1">{errors.subCaste.message}</p>}
              </div>
              <div>
                <label className="label">Mother Tongue *</label>
                <input {...register("motherTongue")} className="input-field" />
                {errors.motherTongue && <p className="text-xs text-red-600 mt-1">{errors.motherTongue.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Height (cm) *</label>
                <input {...register("height", { valueAsNumber: true })} type="number" className="input-field" />
                {errors.height && <p className="text-xs text-red-600 mt-1">{errors.height.message}</p>}
              </div>
              <div>
                <label className="label">Weight (kg) *</label>
                <input {...register("weight", { valueAsNumber: true })} type="number" className="input-field" />
                {errors.weight && <p className="text-xs text-red-600 mt-1">{errors.weight.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Complexion</label>
              <select {...register("complexion")} className="input-field">
                <option value="">Select</option>
                <option value="VERY_FAIR">Very Fair</option>
                <option value="FAIR">Fair</option>
                <option value="WHEATISH">Wheatish</option>
                <option value="BROWN">Brown</option>
                <option value="DARK">Dark</option>
              </select>
              {errors.complexion && <p className="text-xs text-red-600 mt-1">{errors.complexion.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Education *</label>
                <input {...register("education")} className="input-field" placeholder="e.g., B.Tech" />
                {errors.education && <p className="text-xs text-red-600 mt-1">{errors.education.message}</p>}
              </div>
              <div>
                <label className="label">Current Job *</label>
                <input {...register("currentJob")} className="input-field" />
                {errors.currentJob && <p className="text-xs text-red-600 mt-1">{errors.currentJob.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monthly Income (₹) *</label>
                <input {...register("monthlyIncome", { valueAsNumber: true })} type="number" className="input-field" />
                {errors.monthlyIncome && <p className="text-xs text-red-600 mt-1">{errors.monthlyIncome.message}</p>}
              </div>
              <div>
                <label className="label">Physically Challenged *</label>
                <select {...register("physicallyChallenge")} className="input-field">
                  <option value="">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Place of Birth</label>
              <input {...register("placeOfBirth")} className="input-field" />
              {errors.placeOfBirth && <p className="text-xs text-red-600 mt-1">{errors.placeOfBirth.message}</p>}
            </div>

            <div>
              <label className="label">Time of Birth</label>
              <input {...register("timeOfBirth")} type="time" className="input-field" />
              {errors.timeOfBirth && <p className="text-xs text-red-600 mt-1">{errors.timeOfBirth.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Rashi</label>
                <Controller
                  name="rashi"
                  control={control}
                  render={({ field }) => (
                    <SearchDropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={RASHI_LIST}
                      placeholder="Search zodiac sign…"
                    />
                  )}
                />
                {errors.rashi && <p className="text-xs text-red-600 mt-1">{errors.rashi.message}</p>}
              </div>
              <div>
                <label className="label">Nakshatra</label>
                <Controller
                  name="nakshatra"
                  control={control}
                  render={({ field }) => (
                    <SearchDropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={NAKSHATRA_LIST}
                      placeholder="Search star…"
                    />
                  )}
                />
                {errors.nakshatra && <p className="text-xs text-red-600 mt-1">{errors.nakshatra.message}</p>}
              </div>
              <div>
                <label className="label">Lagnam</label>
                <input {...register("lagnam")} className="input-field" />
                {errors.lagnam && <p className="text-xs text-red-600 mt-1">{errors.lagnam.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Other Details</label>
              <textarea {...register("otherDetails")} className="input-field" rows={3} />
            </div>
          </div>
        )}

        {/* Step 2: Family Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Family Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Father&apos;s Name *</label>
                <input {...register("fatherName")} className="input-field" />
                {errors.fatherName && <p className="text-xs text-red-600 mt-1">{errors.fatherName.message}</p>}
              </div>
              <div>
                <label className="label">Father&apos;s Occupation *</label>
                <input {...register("fatherOccupation")} className="input-field" />
                {errors.fatherOccupation && <p className="text-xs text-red-600 mt-1">{errors.fatherOccupation.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Mother&apos;s Name *</label>
                <input {...register("motherName")} className="input-field" />
                {errors.motherName && <p className="text-xs text-red-600 mt-1">{errors.motherName.message}</p>}
              </div>
              <div>
                <label className="label">Mother&apos;s Occupation *</label>
                <input {...register("motherOccupation")} className="input-field" />
                {errors.motherOccupation && <p className="text-xs text-red-600 mt-1">{errors.motherOccupation.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="label">Total Brothers *</label>
                <input {...register("totalBrothers", { valueAsNumber: true })} type="number" min="0" className="input-field" />
                {errors.totalBrothers && <p className="text-xs text-red-600 mt-1">{errors.totalBrothers.message}</p>}
              </div>
              <div>
                <label className="label">Married Brothers *</label>
                <input {...register("marriedBrothers", { valueAsNumber: true })} type="number" min="0" className="input-field" />
                {errors.marriedBrothers && <p className="text-xs text-red-600 mt-1">{errors.marriedBrothers.message}</p>}
              </div>
              <div>
                <label className="label">Total Sisters *</label>
                <input {...register("totalSisters", { valueAsNumber: true })} type="number" min="0" className="input-field" />
                {errors.totalSisters && <p className="text-xs text-red-600 mt-1">{errors.totalSisters.message}</p>}
              </div>
              <div>
                <label className="label">Married Sisters *</label>
                <input {...register("marriedSisters", { valueAsNumber: true })} type="number" min="0" className="input-field" />
                {errors.marriedSisters && <p className="text-xs text-red-600 mt-1">{errors.marriedSisters.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">House Details *</label>
              <select {...register("houseDetails")} className="input-field">
                <option value="" disabled>Select</option>
                <option value="OWN">Own House</option>
                <option value="FAMILY">Family House</option>
                <option value="RENTED">Rented</option>
              </select>
              {errors.houseDetails && <p className="text-xs text-red-600 mt-1">{errors.houseDetails.message}</p>}
            </div>

            <div>
              <label className="label">Family Status *</label>
              <Controller
                name="familyStatus"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: "MC", label: "Middle Class", active: "border-green-500 bg-green-400 text-green-950", idle: "border-green-200 text-green-700 hover:bg-green-50" },
                      { val: "UC", label: "Upper Class",  active: "border-pink-500 bg-pink-400 text-pink-950",   idle: "border-pink-200 text-pink-700 hover:bg-pink-50" },
                      { val: "EC", label: "Elite Class",  active: "border-blue-500 bg-blue-400 text-blue-950",   idle: "border-blue-200 text-blue-700 hover:bg-blue-50" },
                    ].map((opt) => {
                      const selected = field.value === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => field.onChange(opt.val)}
                          className={`flex flex-col items-center justify-center rounded-xl border-2 px-2 py-3 text-center transition ${selected ? opt.active : opt.idle}`}
                        >
                          <span className="text-sm font-bold leading-tight">{opt.label}</span>
                          <span className="mt-0.5 text-[10px] font-semibold opacity-80">({opt.val})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.familyStatus && <p className="text-xs text-red-600 mt-1">{errors.familyStatus.message}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Contact Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Contact Details</h3>

            <div>
              <label className="label">Contact Person Name *</label>
              <input {...register("contactPersonName")} className="input-field" />
              {errors.contactPersonName && <p className="text-xs text-red-600 mt-1">{errors.contactPersonName.message}</p>}
            </div>

            <div>
              <label className="label">Contact Number *</label>
              <Controller
                name="contactNumber"
                control={control}
                render={({ field }) => (
                  <PhoneInput value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
              {errors.contactNumber && <p className="text-xs text-red-600 mt-1">{errors.contactNumber.message}</p>}
            </div>

            <div>
              <label className="label">WhatsApp Number *</label>
              <Controller
                name="whatsappNo"
                control={control}
                render={({ field }) => (
                  <PhoneInput value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
              {errors.whatsappNo && <p className="text-xs text-red-600 mt-1">{errors.whatsappNo.message}</p>}
            </div>

            <div>
              <label className="label">Email ID *</label>
              <input
                {...register("emailId")}
                type="email"
                placeholder="your.email@example.com"
                className="input"
              />
              {errors.emailId && <p className="text-xs text-red-600 mt-1">{errors.emailId.message}</p>}
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700 ring-1 ring-blue-200">
              <p className="font-semibold">📞 Contact details are protected</p>
              <p>Other users can only view your contact details after payment verification.</p>
            </div>
          </div>
        )}

        {/* Step 4: Photos & Expectations */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Photo & Expectations</h3>

            {/* Upload error banner */}
            {uploadError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{uploadError}</span>
                <button
                  type="button"
                  onClick={() => setUploadError("")}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Upload success banner */}
            {uploadSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 animate-in fade-in">
                <CheckCircle size={15} className="shrink-0" />
                Photo uploaded successfully! It will be saved with your profile.
              </div>
            )}

            {/* Single photo slot */}
            {photos.length === 0 ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  disabled={uploadingPhoto}
                  className="hidden"
                  id="photo-input"
                />
                {uploadingPhoto ? (
                  /* ── In-progress: preview + progress bar ── */
                  <div className="flex items-center gap-4 rounded-2xl border-2 border-[#7a1f2b]/30 bg-[#7a1f2b]/5 p-5">
                    {/* Live preview of the selected photo */}
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200">
                      {uploadPreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={uploadPreview}
                          alt="Uploading preview"
                          className="h-full w-full object-cover opacity-70"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-[#7a1f2b]">
                          {uploadProgress}%
                        </span>
                      </div>
                    </div>
                    {/* Progress details */}
                    <div className="flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#7a1f2b]">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#7a1f2b] border-t-transparent" />
                        Uploading your photo…
                      </p>
                      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#7a1f2b] to-[#d4af37] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-500">
                        {uploadProgress < 100
                          ? `${uploadProgress}% uploaded — please keep this page open`
                          : "Processing photo…"}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ── Idle: drop zone ── */
                  <label
                    htmlFor="photo-input"
                    onDragOver={handleZoneDragOver}
                    onDragLeave={() => setDropZoneActive(false)}
                    onDrop={handleZoneDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition ${
                      dropZoneActive
                        ? "border-[#7a1f2b] bg-[#7a1f2b]/5"
                        : "border-slate-300 dark:border-neutral-300 hover:border-[#7a1f2b] hover:bg-[#7a1f2b]/5"
                    }`}
                  >
                    <ImagePlus size={32} className="text-neutral-300" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-neutral-600">
                        Click to upload <span className="font-normal text-neutral-400">or drag &amp; drop</span>
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">JPG, PNG, WEBP · max 5 MB · 1 photo only</p>
                    </div>
                  </label>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="group relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-[#7a1f2b] shadow-md">
                  <Image
                    src={photos[0]}
                    alt="Profile photo"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photos[0])}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
                    title="Remove photo"
                  >
                    <div className="rounded-full bg-red-500 p-2">
                      <X size={16} className="text-white" />
                    </div>
                  </button>
                </div>
                {/* Info */}
                <div className="pt-1">
                  <p className="text-sm font-semibold text-green-700">Photo uploaded ✓</p>
                  <p className="mt-1 text-xs text-neutral-400">Hover on the photo and click × to remove and replace it.</p>
                </div>
              </div>
            )}

            <div>
              <label className="label">Bio / About Me</label>
              <textarea
                {...register("bio")}
                className="input-field"
                rows={3}
                placeholder="Write a short introduction about yourself…"
              />
            </div>

            <div>
              <label className="label">Expectations About Partner</label>
              <textarea
                {...register("expectations")}
                className="input-field"
                rows={5}
                placeholder="What qualities are you looking for in your partner?"
              />
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Preview Your Profile</h3>
            <p className="-mt-2 text-xs text-slate-500 dark:text-neutral-600">
              Please review every detail carefully. After you submit, your profile will be
              <strong> locked</strong> and you will need to contact the admin for any changes.
            </p>

            {/* Photo + name header */}
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 dark:bg-neutral-100 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                {photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[0]} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                    {(watch("name") || "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-neutral-900">{watch("name") || "—"}</p>
                <p className="text-sm text-slate-500 dark:text-neutral-600">
                  {watch("age") ? `${watch("age")} yrs` : "—"}
                  {watch("gender") ? ` · ${watch("gender") === "MALE" ? "Male" : "Female"}` : ""}
                  {watch("religion") ? ` · ${watch("religion")}` : ""}
                </p>
                <p className="text-xs text-slate-400">{photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded</p>
              </div>
            </div>

            <div className="max-h-96 space-y-5 overflow-y-auto rounded-xl bg-slate-50 dark:bg-neutral-100 p-4">
              <PreviewSection title="Personal Details" rows={[
                ["Full Name", watch("name")],
                ["Gender", watch("gender") === "MALE" ? "Male" : watch("gender") === "FEMALE" ? "Female" : ""],
                ["Age", watch("age")],
                ["Date of Birth", watch("dateOfBirth")],
                ["Marital Status", watch("maritalStatus")],
                ["Height", watch("height") ? `${watch("height")} cm` : ""],
                ["Complexion", watch("complexion")],
                ["Religion", watch("religion")],
                ["Caste", watch("caste")],
                ["Sub-Caste", watch("subCaste")],
                ["Mother Tongue", watch("motherTongue")],
                ["Native District", watch("nativeDistrict")],
                ["Address", watch("address")],
                ["Education", watch("education")],
                ["Current Job", watch("currentJob")],
                ["Monthly Income", watch("monthlyIncome") ? `₹${Number(watch("monthlyIncome")).toLocaleString("en-IN")}` : ""],
              ]} />

              <PreviewSection title="Astrology" rows={[
                ["Place of Birth", watch("placeOfBirth")],
                ["Time of Birth", watch("timeOfBirth")],
                ["Rashi", watch("rashi")],
                ["Nakshatra", watch("nakshatra")],
                ["Lagnam", watch("lagnam")],
              ]} />

              <PreviewSection title="Family Details" rows={[
                ["Father's Name", watch("fatherName")],
                ["Father's Occupation", watch("fatherOccupation")],
                ["Mother's Name", watch("motherName")],
                ["Mother's Occupation", watch("motherOccupation")],
                ["Brothers", watch("totalBrothers") != null ? `${watch("totalBrothers")} (${watch("marriedBrothers") ?? 0} married)` : ""],
                ["Sisters", watch("totalSisters") != null ? `${watch("totalSisters")} (${watch("marriedSisters") ?? 0} married)` : ""],
                ["House Details", watch("houseDetails")],
                ["Family Status", watch("familyStatus")],
              ]} />

              <PreviewSection title="Contact Details" rows={[
                ["Contact Person", watch("contactPersonName")],
                ["Contact Number", watch("contactNumber")],
                ["WhatsApp", watch("whatsappNo")],
                ["Email", watch("emailId")],
              ]} />

              <PreviewSection title="About & Expectations" rows={[
                ["Bio", watch("bio")],
                ["Expectations", watch("expectations")],
              ]} />
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-sm ${message.ok ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
                {message.text}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="flex-1 rounded-xl border border-primary px-4 py-2 font-semibold text-primary transition hover:bg-primary/5">
              ← Previous
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={async () => {
                let ok = true;
                if (step === 0) {
                  ok = await trigger([
                    "name", "gender", "age", "dateOfBirth", "maritalStatus", "nativeDistrict",
                    "religion", "caste", "education", "address", "subCaste", "motherTongue",
                    "height", "complexion", "currentJob", "monthlyIncome",
                    "placeOfBirth", "timeOfBirth", "rashi", "nakshatra", "lagnam",
                  ]);
                } else if (step === 1) {
                  ok = await trigger([
                    "fatherName", "fatherOccupation", "motherName", "motherOccupation",
                    "totalBrothers", "marriedBrothers", "totalSisters", "marriedSisters",
                    "houseDetails", "familyStatus",
                  ]);
                } else if (step === 2) {
                  ok = await trigger(["contactPersonName", "contactNumber", "whatsappNo", "emailId"]);
                }
                if (!ok) return;
                setStep(step + 1);
              }}
              className="flex-1 btn-primary"
            >
              Next →
            </button>
          )}
          {step === STEPS.length - 1 && (
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? "Submitting..." : "Confirm & Submit"}
            </button>
          )}
        </div>
      </form>

      {/* Finalize confirmation — locking is permanent for the user */}
      {confirmFinalize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-100 p-6 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-neutral-900">Submit &amp; Lock Profile?</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Once you submit, your profile will be <strong>locked</strong> and you will
              <strong> not be able to edit it</strong> yourself. To make any changes afterwards,
              you will need to <strong>contact the admin</strong>.
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-800">
              Have you reviewed all your details and want to continue?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={doFinalize}
                disabled={saving}
                className="flex-1 rounded-lg bg-[#7a1f2b] py-2.5 text-sm font-bold text-white hover:bg-[#6b1823] transition-colors disabled:opacity-60"
              >
                {saving ? "Submitting…" : "Yes, Submit & Lock"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmFinalize(false)}
                disabled={saving}
                className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-60"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Preview section (label/value rows; empty values shown as "—") ─────────────
function PreviewSection({ title, rows }: { title: string; rows: [string, any][] }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">{title}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
            <p className="truncate text-sm text-slate-700 dark:text-neutral-800">
              {value !== null && value !== undefined && value !== "" ? String(value) : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
