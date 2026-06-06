"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { matrimonyProfileSchema } from "@/lib/validators";
import { z } from "zod";
import { updateMatrimonyProfileAction } from "@/app/actions/profileActions";
import Image from "next/image";
import { GripVertical, X, ImagePlus, Save, Star } from "lucide-react";

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
  "Kanyakumari", "Tirunelveli", "Tuticorin", "Virudunagar", "Madurai",
  "Sivagangai", "Dindigul", "Theni", "Coimbatore", "Nilgiris",
  "Salem", "Namakkal", "Erode", "Tiruppur", "Krishnagiri",
  "Vellore", "Ranipet", "Tirupathur", "Chengalpattu", "Kanchipuram",
  "Thiruvallur", "Villupuram", "Cuddalore", "Tiruvannamalai", "Ariyalur",
  "Perambalur", "Kallakurichi", "Nagapattinam", "Tikarur", "Mayiladuthurai",
  "Thanjavur", "Pudukkottai", "Ramanathapuram", "Karur", "Trichy",
  "Villupuram", "Chennai",
];

export function MatrimonyProfileForm({ defaultProfile }: { defaultProfile?: any }) {
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>(defaultProfile?.photos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Drag-to-reorder state
  const [dragIndex, setDragIndex]   = useState<number | null>(null);
  const [overIndex, setOverIndex]   = useState<number | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder]   = useState(false);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const dragNode = useRef<EventTarget | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    // cast required: @hookform/resolvers bundles its own react-hook-form types causing TS2719
    resolver: zodResolver(matrimonyProfileSchema) as any, // eslint-disable-line
    defaultValues: defaultProfile || {
      gender: "MALE",
      religion: "HINDU",
      maritalStatus: "SINGLE",
      familyStatus: "MC",
    },
  });

  const age = watch("age");
  const dateOfBirth = watch("dateOfBirth");

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setMessage(null);
    const result = await updateMatrimonyProfileAction({ ...data, photos });
    if (result.ok) {
      setMessage({ text: "Profile saved successfully! 🎉", ok: true });
      if (result.profileId) {
        setTimeout(() => window.location.reload(), 2000);
      }
    } else {
      setMessage({ text: result.message || "Failed to save profile", ok: false });
    }
    setSaving(false);
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 6) return;

    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("photo", file);

    const res = await fetch("/api/photos", { method: "POST", body: fd });
    const data = await res.json();

    if (res.ok && data.url) {
      setPhotos((prev) => [...prev, data.url]);
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
      setOrderChanged(true);
    }
  };

  // ── Drag-to-reorder handlers ──────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, i: number) => {
    dragNode.current = e.target;
    setDragIndex(i);
    // Make the ghost image slightly transparent
    const img = new window.Image();
    img.src = photos[i];
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIndex !== i) setOverIndex(i);
  };

  const handleDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const next = [...photos];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    setPhotos(next);
    setOrderChanged(true);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    dragNode.current = null;
    setDragIndex(null);
    setOverIndex(null);
  };

  // ── OS file drop on the upload zone ──────────────────────────────────────
  const handleZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(true);
  };

  const handleZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || photos.length >= 6) return;
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("photo", file);
    const res  = await fetch("/api/photos", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) setPhotos((prev) => [...prev, data.url]);
    setUploadingPhoto(false);
  };

  // ── Save reordered photos to DB without full form submit ──────────────────
  const saveOrder = async () => {
    setSavingOrder(true);
    const res = await fetch("/api/photos/reorder", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ photos }),
    });
    if (res.ok) setOrderChanged(false);
    setSavingOrder(false);
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-primary">{STEPS[step]}</span>
          <span className="text-slate-500">{step + 1} of {STEPS.length}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
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
              <label className="label">Address</label>
              <input {...register("address")} className="input-field" placeholder="Street address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Gender *</label>
                <select {...register("gender")} className="input-field">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date of Birth *</label>
                <input {...register("dateOfBirth")} type="date" className="input-field" />
              </div>
              <div>
                <label className="label">Native District *</label>
                <select {...register("nativeDistrict")} className="input-field">
                  <option value="">Select District</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
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
              </div>
              <div>
                <label className="label">Caste *</label>
                <input {...register("caste")} className="input-field" placeholder="Caste/Community" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Sub Caste</label>
                <input {...register("subCaste")} className="input-field" />
              </div>
              <div>
                <label className="label">Mother Tongue</label>
                <input {...register("motherTongue")} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Height (cm)</label>
                <input {...register("height", { valueAsNumber: true })} type="number" className="input-field" />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input {...register("weight", { valueAsNumber: true })} type="number" className="input-field" />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Education *</label>
                <input {...register("education")} className="input-field" placeholder="e.g., B.Tech" />
              </div>
              <div>
                <label className="label">Current Job</label>
                <input {...register("currentJob")} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monthly Income (₹)</label>
                <input {...register("monthlyIncome", { valueAsNumber: true })} type="number" className="input-field" />
              </div>
              <div>
                <label className="label">Physically Challenged</label>
                <select {...register("physicallyChallenge")} className="input-field">
                  <option value="">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Place of Birth</label>
              <input {...register("placeOfBirth")} className="input-field" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Rashi</label>
                <input {...register("rashi")} className="input-field" placeholder="Zodiac sign" />
              </div>
              <div>
                <label className="label">Nakshatra</label>
                <input {...register("nakshatra")} className="input-field" />
              </div>
              <div>
                <label className="label">Lagnam</label>
                <input {...register("lagnam")} className="input-field" />
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
                <label className="label">Father&apos;s Name</label>
                <input {...register("fatherName")} className="input-field" />
              </div>
              <div>
                <label className="label">Father&apos;s Occupation</label>
                <input {...register("fatherOccupation")} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Mother&apos;s Name</label>
                <input {...register("motherName")} className="input-field" />
              </div>
              <div>
                <label className="label">Mother&apos;s Occupation</label>
                <input {...register("motherOccupation")} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="label">Total Brothers</label>
                <input {...register("totalBrothers", { valueAsNumber: true })} type="number" className="input-field" />
              </div>
              <div>
                <label className="label">Married Brothers</label>
                <input {...register("marriedBrothers", { valueAsNumber: true })} type="number" className="input-field" />
              </div>
              <div>
                <label className="label">Total Sisters</label>
                <input {...register("totalSisters", { valueAsNumber: true })} type="number" className="input-field" />
              </div>
              <div>
                <label className="label">Married Sisters</label>
                <input {...register("marriedSisters", { valueAsNumber: true })} type="number" className="input-field" />
              </div>
            </div>

            <div>
              <label className="label">House Details</label>
              <select {...register("houseDetails")} className="input-field">
                <option value="">Select</option>
                <option value="OWN">Own House</option>
                <option value="FAMILY">Family House</option>
                <option value="RENTED">Rented</option>
              </select>
            </div>

            <div>
              <label className="label">Family Status *</label>
              <select {...register("familyStatus")} className="input-field">
                <option value="MC">Middle Class</option>
                <option value="UC">Upper Class</option>
                <option value="EC">Elite Class</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Contact Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Contact Details</h3>

            <div>
              <label className="label">Contact Person Name</label>
              <input {...register("contactPersonName")} className="input-field" />
            </div>

            <div>
              <label className="label">Contact Number (10 digits)</label>
              <input {...register("contactNumber")} type="tel" className="input-field" placeholder="9876543210" />
              {errors.contactNumber && <p className="text-xs text-red-600 mt-1">{errors.contactNumber.message}</p>}
            </div>

            <div>
              <label className="label">WhatsApp Number (10 digits)</label>
              <input {...register("whatsappNo")} type="tel" className="input-field" placeholder="9876543210" />
              {errors.whatsappNo && <p className="text-xs text-red-600 mt-1">{errors.whatsappNo.message}</p>}
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Photos & Expectations</h3>
              <span className="text-xs font-medium text-neutral-400">{photos.length} / 6 photos</span>
            </div>

            {/* Upload zone — supports click AND OS file drag-drop */}
            {photos.length < 6 && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadPhoto}
                  disabled={uploadingPhoto}
                  className="hidden"
                  id="photo-input"
                />
                <label
                  htmlFor="photo-input"
                  onDragOver={handleZoneDragOver}
                  onDragLeave={() => setDropZoneActive(false)}
                  onDrop={handleZoneDrop}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition ${
                    dropZoneActive
                      ? "border-[#7a1f2b] bg-[#7a1f2b]/5"
                      : "border-slate-300 hover:border-[#7a1f2b] hover:bg-[#7a1f2b]/5"
                  }`}
                >
                  {uploadingPhoto ? (
                    <>
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7a1f2b] border-t-transparent" />
                      <p className="text-sm font-medium text-neutral-500">Uploading…</p>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-neutral-400" />
                      <p className="text-sm font-medium text-neutral-600">
                        Click to upload <span className="text-neutral-400">or drag &amp; drop</span>
                      </p>
                      <p className="text-xs text-neutral-400">JPG, PNG, WEBP · max 5 MB</p>
                    </>
                  )}
                </label>
              </div>
            )}

            {/* Drag-to-reorder grid */}
            {photos.length > 0 && (
              <>
                {photos.length > 1 && (
                  <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <GripVertical size={12} />
                    Drag photos to reorder · First photo is the cover
                  </p>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {photos.map((url, i) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`group relative cursor-grab overflow-hidden rounded-xl border-2 transition-all duration-150 active:cursor-grabbing ${
                        dragIndex === i
                          ? "scale-95 opacity-40 border-neutral-300"
                          : overIndex === i && dragIndex !== null
                          ? "scale-105 border-[#7a1f2b] shadow-lg"
                          : "border-transparent hover:border-neutral-200"
                      }`}
                    >
                      {/* Cover / number badge */}
                      <div className="absolute left-1.5 top-1.5 z-10">
                        {i === 0 ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-[#d4af37] px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                            <Star size={8} fill="white" />
                            Cover
                          </span>
                        ) : (
                          <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {i + 1}
                          </span>
                        )}
                      </div>

                      {/* Drag handle — visible on hover */}
                      <div className="absolute right-1.5 top-1.5 z-10 opacity-0 transition group-hover:opacity-100">
                        <div className="rounded bg-black/50 p-0.5">
                          <GripVertical size={14} className="text-white" />
                        </div>
                      </div>

                      {/* Photo */}
                      <Image
                        src={url}
                        alt={`Photo ${i + 1}`}
                        width={150}
                        height={150}
                        className="h-28 w-full object-cover"
                        draggable={false}
                      />

                      {/* Delete overlay */}
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
                        title="Remove photo"
                      >
                        <div className="rounded-full bg-red-500 p-1.5">
                          <X size={14} className="text-white" />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Save order button — appears when order has changed */}
                {orderChanged && (
                  <button
                    type="button"
                    onClick={saveOrder}
                    disabled={savingOrder}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#7a1f2b] py-2.5 text-sm font-semibold text-[#7a1f2b] transition hover:bg-[#7a1f2b]/5 disabled:opacity-50"
                  >
                    <Save size={14} />
                    {savingOrder ? "Saving order…" : "Save photo order"}
                  </button>
                )}
              </>
            )}

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

            <div className="rounded-xl bg-slate-50 p-4 max-h-96 overflow-y-auto space-y-2 text-sm">
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
            <button type="button" onClick={() => setStep(step + 1)} className="flex-1 btn-primary">
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
