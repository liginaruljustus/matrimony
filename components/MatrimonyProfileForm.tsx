"use client";

import { useState } from "react";
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
import { X, ImagePlus, AlertCircle } from "lucide-react";

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
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivagangai", "Tenkasi",
  "Thanjavur", "Theni", "Thiruvallur", "Thiruvarur", "Thoothukudi",
  "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai",
  "Trichy", "Vellore", "Villupuram", "Virudhunagar",
].sort((a, b) => a.localeCompare(b));

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

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

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setMessage(null);
    const result = await updateMatrimonyProfileAction({ ...data, photos });
    if (result.ok) {
      setMessage({ text: "Profile saved successfully! 🎉", ok: true });
      onSaved?.();
      if (result.profileId) {
        setTimeout(() => window.location.reload(), 2000);
      }
    } else {
      setMessage({ text: result.message || "Failed to save profile", ok: false });
    }
    setSaving(false);
  };

  const uploadPhoto = async (file: File) => {
    if (photos.length >= 1) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/photos", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Photo upload failed:", err);
        return;
      }
      const { url } = await res.json();
      setPhotos([url]);
    } finally {
      setUploadingPhoto(false);
    }
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
                <input {...register("age", { valueAsNumber: true })} type="number" className="input-field" />
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
                <label className="label">Sub Caste *</label>
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
              <label className="label">Complexion *</label>
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
                <input {...register("rashi")} className="input-field" placeholder="Zodiac sign" />
                {errors.rashi && <p className="text-xs text-red-600 mt-1">{errors.rashi.message}</p>}
              </div>
              <div>
                <label className="label">Nakshatra</label>
                <input {...register("nakshatra")} className="input-field" />
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
              <select {...register("familyStatus")} className="input-field">
                <option value="MC">Middle Class</option>
                <option value="UC">Upper Class</option>
                <option value="EC">Elite Class</option>
              </select>
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
                  {uploadingPhoto ? (
                    <>
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7a1f2b] border-t-transparent" />
                      <p className="text-sm font-medium text-neutral-500">Uploading to Cloudinary…</p>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={32} className="text-neutral-300" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-neutral-600">
                          Click to upload <span className="font-normal text-neutral-400">or drag &amp; drop</span>
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">JPG, PNG, WEBP · max 5 MB · 1 photo only</p>
                      </div>
                    </>
                  )}
                </label>
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
            <h3 className="text-lg font-semibold text-primary">Review Your Profile</h3>

            <div className="rounded-xl bg-slate-50 dark:bg-neutral-100 p-4 max-h-96 overflow-y-auto space-y-2 text-sm">
              <p><strong>Name:</strong> {watch("name")}</p>
              <p><strong>Age:</strong> {watch("age")}</p>
              <p><strong>Religion:</strong> {watch("religion")}</p>
              <p><strong>Education:</strong> {watch("education")}</p>
              <p><strong>Photos:</strong> {photos.length} uploaded</p>
              <p><strong>Expectations:</strong> {watch("expectations") || "Not specified"}</p>
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
              {saving ? "Saving..." : "Save Profile"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
