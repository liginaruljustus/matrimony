type ProfileDetailsInput = {
  district?: string | null;
  maritalStatus?: string | null;
  gender?: string | null;
  age?: number | null;
  religion?: string | null;
  caste?: string | null;
  education?: string | null;
  monthlyIncome?: number | null;
  physicallyChallenged?: boolean | null;
  familyStatus?: string | null;
};

/** The numbered 10-field "Profile Details" summary, shared across every profile view. */
export function ProfileDetailsList({ profile }: { profile: ProfileDetailsInput }) {
  const rows = [
    { label: "Native District", value: profile.district || "—" },
    { label: "Marital status", value: profile.maritalStatus ? profile.maritalStatus.replace("_", " ") : "—" },
    { label: "Gender", value: profile.gender === "MALE" ? "Male" : profile.gender === "FEMALE" ? "Female" : "—" },
    { label: "Age", value: profile.age ? String(profile.age) : "—" },
    { label: "Religion", value: profile.religion || "—" },
    { label: "Caste", value: profile.caste || "—" },
    { label: "Education", value: profile.education || "—" },
    {
      label: "Monthly Income",
      value: profile.monthlyIncome != null ? `₹${profile.monthlyIncome.toLocaleString("en-IN")}` : "—",
    },
    {
      label: "Physically Challenged",
      value: profile.physicallyChallenged == null ? "—" : profile.physicallyChallenged ? "Yes" : "No",
    },
    {
      label: "Family Status",
      value: profile.familyStatus === "MC" ? "Middle Class"
        : profile.familyStatus === "UC" ? "Upper Class"
        : profile.familyStatus === "EC" ? "Elite Class"
        : "—",
    },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-100 p-4 shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-200">
      <h2 className="mb-3 text-sm font-semibold text-[#7a1f2b]">Profile Details</h2>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-200">
        {rows.map(({ label, value }, i) => (
          <div key={label} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7a1f2b]/10 text-[10px] font-bold text-[#7a1f2b]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="w-40 shrink-0 text-sm font-medium text-neutral-600 dark:text-neutral-700">{label}</span>
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
