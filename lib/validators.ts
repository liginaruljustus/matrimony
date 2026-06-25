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
  age: z.coerce.number().min(18, "Age must be at least 18").max(80),
  religion: z.enum(["HINDU", "MUSLIM", "CHRISTIAN", "OTHER"]),
  caste: z.string().min(2),
  subCaste: z.string().min(1, "Sub Caste is required"),
  placeOfBirth: z.string().optional(),
  timeOfBirth: z.string().optional(),
  rashi: z.string().optional(),
  nakshatra: z.string().optional(),
  lagnam: z.string().optional(),
  motherTongue: z.string().min(2, "Mother Tongue is required"),
  height: z.coerce.number().positive("Height must be positive"),
  weight: z.coerce.number().positive("Weight must be positive"),
  education: z.string().min(2, "Education is required"),
  currentJob: z.string().min(2, "Current Job is required"),
  monthlyIncome: z.coerce.number().min(0, "Enter monthly income"),
  complexion: z.string().min(1, "Complexion is required"),
  physicallyChallenge: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean()
  ),
  otherDetails: z.string().max(500).optional(),

  // Family Details
  fatherName: z.string().min(2, "Father's Name is required"),
  fatherOccupation: z.string().min(2, "Father's Occupation is required"),
  motherName: z.string().min(2, "Mother's Name is required"),
  motherOccupation: z.string().min(2, "Mother's Occupation is required"),
  totalBrothers: z.coerce.number().min(0),
  marriedBrothers: z.coerce.number().min(0),
  totalSisters: z.coerce.number().min(0),
  marriedSisters: z.coerce.number().min(0),
  houseDetails: z.string().min(1, "House Details is required"),
  familyStatus: z.enum(["MC", "UC", "EC"]),

  // Contact Details
  contactPersonName: z.string().min(2, "Contact Person Name is required"),
  contactNumber: z.string().min(1, "Contact number is required").refine(
    (v) => /^\+\d{7,15}$/.test(v),
    { message: "Enter a valid contact number with country code" },
  ),
  whatsappNo: z.string().min(1, "WhatsApp number is required").refine(
    (v) => /^\+\d{7,15}$/.test(v),
    { message: "Enter a valid WhatsApp number with country code" },
  ),
  emailId: z.string().email("Email ID must be a valid email address"),

  // Additional
  bio: z.string().max(500).optional(),
  expectations: z.string().max(1000).optional(),
  photos: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  const minAge = data.gender === "FEMALE" ? 18 : 21;
  if (data.age < minAge) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["age"],
      message: `Minimum age for ${data.gender === "FEMALE" ? "Female" : "Male"} is ${minAge} years`,
    });
  }
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
