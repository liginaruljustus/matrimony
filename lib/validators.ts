import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must have at least 8 characters"),
});

export const registerWithRoleSchema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().length(10, "Phone number must be 10 digits").regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  profileType: z.enum(["BRIDE", "GROOM"], { message: "Select Bride or Groom" }),
  familyClass: z.enum(["MC", "UC", "EC"], { message: "Select family class" }),
});

export const profileSchema = z.object({
  age: z.coerce.number().min(21).max(60),
  religion: z.string().min(2),
  caste: z.string().min(2),
  location: z.string().min(2),
  education: z.string().min(2),
  income: z.coerce.number().min(1),
  bio: z.string().max(500).optional(),
});

export const matrimonyProfileSchema = z.object({
  // Personal Details
  name: z.string().min(2).max(50),
  address: z.string().min(5).max(200),
  nativeDistrict: z.string().min(2),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "SEPARATED", "WIDOWED"]),
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  age: z.coerce.number().min(21).max(60),
  religion: z.enum(["HINDU", "MUSLIM", "CHRISTIAN", "OTHER"]),
  caste: z.string().min(2),
  subCaste: z.string().optional(),
  placeOfBirth: z.string().optional(),
  timeOfBirth: z.string().optional(),
  rashi: z.string().optional(),
  nakshatra: z.string().optional(),
  lagnam: z.string().optional(),
  motherTongue: z.string().optional(),
  height: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().optional(),
  education: z.string().min(2),
  currentJob: z.string().optional(),
  monthlyIncome: z.coerce.number().min(0).optional(),
  complexion: z.string().optional(),
  physicallyChallenge: z.boolean().optional(),
  otherDetails: z.string().max(500).optional(),

  // Family Details
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  totalBrothers: z.coerce.number().min(0).optional(),
  marriedBrothers: z.coerce.number().min(0).optional(),
  totalSisters: z.coerce.number().min(0).optional(),
  marriedSisters: z.coerce.number().min(0).optional(),
  houseDetails: z.string().optional(),
  familyStatus: z.enum(["MC", "UC", "EC"]).optional(),

  // Contact Details
  contactPersonName: z.string().optional(),
  contactNumber: z.string().regex(/^\d{10}$/).optional(),
  whatsappNo: z.string().regex(/^\d{10}$/).optional(),

  // Additional
  expectations: z.string().max(1000).optional(),
  photos: z.array(z.string()).optional(),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1).max(1000),
});

// OTP flow — registration email verification
export const sendOtpSchema = z.object({
  name:        z.string().min(2, "Name must have at least 2 characters"),
  email:       z.string().email("Enter a valid email"),
  phone:       z.string().length(10, "Phone number must be 10 digits").regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  profileType: z.enum(["BRIDE", "GROOM"],                           { message: "Select Bride or Groom" }),
  familyClass: z.enum(["MC", "UC", "EC"],                           { message: "Select family class" }),
  religion:    z.enum(["HINDU", "MUSLIM", "CHRISTIAN", "OTHER"],    { message: "Select your religion" }),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  otp:   z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be 6 digits"),
});
