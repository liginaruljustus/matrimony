# Matrimony Profile Form - Fields List

## ✅ REQUIRED Fields (Must be filled to save)

### Personal Details
- Name *
- Address *
- Native District *
- Marital Status *
- Gender *
- Date of Birth *
- Age *
- Religion *
- Caste *
- Sub Caste *
- Mother Tongue *
- Height (cm) *
- Weight (kg) *
- Education *
- Current Job *
- Monthly Income *
- Physically Challenged *

### Family Details
- Father's Name *
- Father's Occupation *
- Mother's Name *
- Mother's Occupation *
- Total Brothers *
- Married Brothers *
- Total Sisters *
- Married Sisters *
- House Details *
- Family Status *

### Contact Details
- Contact Person Name *
- Contact Number *
- WhatsApp Number *
- Email ID *

---

## ❌ OPTIONAL Fields (Can be left empty)

### Astrology Details
- Place of Birth (optional)
- Time of Birth (optional)
- Rashi (optional)
- Nakshatra (optional)
- Lagnam (optional)

### Other
- Complexion (optional)
- Other Details (optional)
- Bio / About Me (optional)
- Partner Expectations (optional)
- Photos (optional)

---

## Summary

**Required Count:** 31 fields
**Optional Count:** 10 fields
**Total Fields:** 41 fields

### Recently Made Optional
✅ Place of Birth - removed asterisk
✅ Time of Birth - removed asterisk
✅ Rashi - removed asterisk
✅ Nakshatra - removed asterisk
✅ Lagnam - removed asterisk

These astrology fields can now be left blank without affecting profile submission.

---

## Changes Made

### Validator (`lib/validators.ts`)
```typescript
// Before
placeOfBirth: z.string().min(2, "Place of Birth is required"),
rashi: z.string().min(2, "Rashi is required"),

// After
placeOfBirth: z.string().min(2).optional(),
rashi: z.string().min(2).optional(),
```

### Form Component (`components/MatrimonyProfileForm.tsx`)
```typescript
// Before
<label className="label">Place of Birth *</label>

// After
<label className="label">Place of Birth</label>
```

All 5 astrology fields (Place of Birth, Time of Birth, Rashi, Nakshatra, Lagnam) have been updated in both the validator and form UI.
