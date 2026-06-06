/**
 * Card Generator
 *
 * 4 card types per profile:
 *  MD — Marriage Details   : public browsing (name, age, religion, caste, district, education, photo)
 *  AD — Additional Details : unlocked after 1st payment (family, job, income, horoscope details)
 *  CD — Contact Details    : unlocked after 2nd payment (phone, whatsapp, contact person)
 *  FD — Full Details       : complete profile, sent to user email on registration
 */

export type CardType = "MD" | "AD" | "CD" | "FD";

export interface MDCard {
  cardType: "MD";
  profileId: string;
  name: string;
  age: number;
  religion: string;
  caste: string;
  subCaste?: string;
  district: string;
  education: string;
  currentJob?: string;
  height?: number;
  complexion?: string;
  maritalStatus?: string;
  photo?: string;
  familyClass: string;
  profileType: string;
  nakshatra?: string;
  rashi?: string;
}

export interface ADCard {
  cardType: "AD";
  profileId: string;
  // All MD fields
  name: string;
  age: number;
  religion: string;
  caste: string;
  district: string;
  education: string;
  familyClass: string;
  // Additional details
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  totalBrothers?: number;
  marriedBrothers?: number;
  totalSisters?: number;
  marriedSisters?: number;
  houseDetails?: string;
  familyStatus?: string;
  monthlyIncome?: number;
  placeOfBirth?: string;
  timeOfBirth?: string;
  lagnam?: string;
  nakshatra?: string;
  rashi?: string;
  photos?: string[];
  expectations?: string;
}

export interface CDCard {
  cardType: "CD";
  profileId: string;
  contactPersonName?: string;
  contactNumber?: string;
  whatsappNo?: string;
  email?: string;
}

export interface FDCard {
  cardType: "FD";
  profileId: string;
  // All fields combined
  [key: string]: any;
}

/** Build MD card from a profile + user document */
export function buildMDCard(user: any, profile: any): MDCard {
  return {
    cardType:     "MD",
    profileId:    user.profileId ?? "",
    name:         user.name ?? "",
    age:          profile.age ?? 0,
    religion:     profile.religion ?? "",
    caste:        profile.caste ?? "",
    subCaste:     profile.subCaste,
    district:     profile.nativeDistrict ?? profile.location ?? "",
    education:    profile.education ?? "",
    currentJob:   profile.currentJob,
    height:       profile.height,
    complexion:   profile.complexion,
    maritalStatus:profile.maritalStatus,
    photo:        profile.photos?.[0],
    familyClass:  user.familyClass ?? profile.familyClass ?? "",
    profileType:  user.profileType ?? profile.profileType ?? "",
    nakshatra:    profile.nakshatra,
    rashi:        profile.rashi,
  };
}

/** Build AD card */
export function buildADCard(user: any, profile: any): ADCard {
  return {
    cardType:        "AD",
    profileId:       user.profileId ?? "",
    name:            user.name ?? "",
    age:             profile.age ?? 0,
    religion:        profile.religion ?? "",
    caste:           profile.caste ?? "",
    district:        profile.nativeDistrict ?? profile.location ?? "",
    education:       profile.education ?? "",
    familyClass:     user.familyClass ?? profile.familyClass ?? "",
    fatherName:      profile.fatherName,
    fatherOccupation:profile.fatherOccupation,
    motherName:      profile.motherName,
    motherOccupation:profile.motherOccupation,
    totalBrothers:   profile.totalBrothers,
    marriedBrothers: profile.marriedBrothers,
    totalSisters:    profile.totalSisters,
    marriedSisters:  profile.marriedSisters,
    houseDetails:    profile.houseDetails,
    familyStatus:    profile.familyStatus,
    monthlyIncome:   profile.monthlyIncome ?? profile.income,
    placeOfBirth:    profile.placeOfBirth,
    timeOfBirth:     profile.timeOfBirth,
    lagnam:          profile.lagnam,
    nakshatra:       profile.nakshatra,
    rashi:           profile.rashi,
    photos:          profile.photos,
    expectations:    profile.expectations,
  };
}

/** Build CD card */
export function buildCDCard(user: any, profile: any): CDCard {
  return {
    cardType:          "CD",
    profileId:         user.profileId ?? "",
    contactPersonName: profile.contactPersonName,
    contactNumber:     profile.contactNumber,
    whatsappNo:        profile.whatsappNo,
    email:             user.email,
  };
}

/** Build FD card (everything) */
export function buildFDCard(user: any, profile: any): FDCard {
  const md = buildMDCard(user, profile);
  const ad = buildADCard(user, profile);
  const cd = buildCDCard(user, profile);
  return {
    ...md,
    ...ad,
    ...cd,
    cardType:     "FD",
    profileId:    user.profileId ?? "",
    otherDetails: profile.otherDetails,
    address:      profile.address,
    dateOfBirth:  profile.dateOfBirth,
    bio:          profile.bio,
  };
}

/** Payment amounts by family class */
export const PAYMENT_AMOUNTS: Record<string, number> = {
  MC: 500,
  UC: 2500,
  EC: 5000,
};

/** Check if a favorite's Move-to-Payment lock has expired (3 days) */
export function isPaymentLockExpired(fav: any): boolean {
  if (!fav?.paymentLockExpiresAt) return false;
  return new Date() > new Date(fav.paymentLockExpiresAt);
}

/** Check if inbox 30-day freeze is still active */
export function isInboxFrozen(fav: any): boolean {
  if (!fav?.inboxFrozenUntil) return false;
  return new Date() < new Date(fav.inboxFrozenUntil);
}

/** Add 3 days to a date */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
