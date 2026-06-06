"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFilterStore } from "@/store/filterStore";
import { MapPin, Search } from "lucide-react";

const tnDistricts = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
  "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul",
  "Thanjavur", "Tiruppur", "Nagercoil", "Kanchipuram", "Hosur",
];

export function QuickSearchCard() {
  const [district, setDistrict] = useState("Chennai");
  const router = useRouter();
  const setFilters = useFilterStore((s) => s.setFilters);

  const onSearch = () => {
    setFilters({ location: district });
    router.push("/profiles");
  };

  return (
    <section className="card">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <MapPin size={20} className="text-primary" strokeWidth={2} />
        </div>
        <div>
          <h2 className="section-title leading-tight">Quick Search</h2>
          <p className="text-xs text-text-secondary">Find profiles by district</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Select District</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="input-field"
          >
            {tnDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onSearch}
          className="btn-gold w-full py-3 font-semibold transition-fast hover:shadow-md active:scale-95"
        >
          <Search size={16} className="mr-2 inline" />
          Find Profiles in {district}
        </button>
      </div>
    </section>
  );
}
