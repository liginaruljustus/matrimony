import { Schema, model, models, InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, index: true },
    passwordHash: { type: String, required: true },
    image: { type: String },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    profileId: { type: String, unique: true, sparse: true, index: true },
    // autoPassword intentionally removed — derived on-demand from phone/createdAt/name.
    profileType: { type: String, enum: ["BRIDE", "GROOM"] },
    familyClass: { type: String, enum: ["MC", "UC", "EC"] },
    termsAcceptedAt: { type: Date },
    // Freeze system (on user level too)
    isFrozen:     { type: Boolean, default: false, index: true },
    frozenAt:     { type: Date },
    isAutoFrozen: { type: Boolean, default: false },
    autoFrozenAt: { type: Date },
    // Admin-related fields
    status: { type: String, enum: ["ACTIVE", "SUSPENDED", "BANNED", "INACTIVE"], default: "ACTIVE", index: true },
    suspendedAt: { type: Date },
    suspendReason: { type: String },
    verificationStatus: { type: String, enum: ["UNVERIFIED", "VERIFIED", "REJECTED"], default: "UNVERIFIED", index: true },
    verificationDocuments: [
      {
        url: String,
        type: String,
        status: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String },
    lastLogin: { type: Date },
    lastActivity: { type: Date },
  },
  { timestamps: true },
);

const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    // Basic fields
    age: { type: Number, required: true },
    religion: { type: String, required: true },
    caste: { type: String, required: true },
    location: { type: String, required: true },
    education: { type: String, required: true },
    income: { type: Number, required: true },
    bio: { type: String },
    photos: [{ type: String }],
    // Matrimony Profile Fields
    // Personal Details
    address: { type: String },
    nativeDistrict: { type: String },
    maritalStatus: { type: String, enum: ["SINGLE", "MARRIED", "DIVORCED", "SEPARATED", "WIDOWED"] },
    gender: { type: String, enum: ["MALE", "FEMALE"] },
    dateOfBirth: { type: Date },
    subCaste: { type: String },
    placeOfBirth: { type: String },
    timeOfBirth: { type: String },
    rashi: { type: String },
    nakshatra: { type: String },
    lagnam: { type: String },
    motherTongue: { type: String },
    height: { type: Number }, // cm
    weight: { type: Number }, // kg
    complexion: { type: String },
    currentJob: { type: String },
    monthlyIncome: { type: Number },
    physicallyChallenge: { type: Boolean, default: false },
    otherDetails: { type: String },
    // Family Details
    fatherName: { type: String },
    fatherOccupation: { type: String },
    motherName: { type: String },
    motherOccupation: { type: String },
    totalBrothers: { type: Number },
    marriedBrothers: { type: Number },
    totalSisters: { type: Number },
    marriedSisters: { type: Number },
    houseDetails: { type: String },
    familyStatus: { type: String, enum: ["MC", "UC", "EC"] },
    // Contact Details
    contactPersonName: { type: String },
    contactNumber: { type: String },
    whatsappNo: { type: String },
    // System
    profileType: { type: String, enum: ["BRIDE", "GROOM"] },
    familyClass: { type: String, enum: ["MC", "UC", "EC"] },
    expectations: { type: String },
    // Admin moderation fields
    profileStatus: { type: String, enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "FLAGGED"], default: "DRAFT", index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvalDate: { type: Date },
    rejectionReason: { type: String },
    flaggedReason: { type: String },
    contentScore: { type: Number, min: 0, max: 100 },
    moderationNotes: { type: String },
    // Card system — 4 card types auto-generated on profile approval
    // MD = Marriage Details (public browsing)
    // AD = Additional Details (after 1st payment)
    // CD = Contact Details (after 2nd payment)
    // FD = Full Details (sent to user email)
    generatedCards: {
      MD: { type: Boolean, default: false },
      AD: { type: Boolean, default: false },
      CD: { type: Boolean, default: false },
      FD: { type: Boolean, default: false },
    },
    cardsGeneratedAt: { type: Date },
    // Freeze system
    isFrozen:      { type: Boolean, default: false, index: true },
    frozenAt:      { type: Date },
    frozenReason:  { type: String },
    frozenBy:      { type: Schema.Types.ObjectId, ref: "User" }, // self or admin
    isAutoFrozen:  { type: Boolean, default: false },
    autoFrozenAt:  { type: Date },
    lastActivity:  { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

const interestSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "DECLINED"], default: "PENDING" },
  },
  { timestamps: true },
);
interestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

const conversationSchema = new Schema(
  {
    participantAId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    participantBId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);
conversationSchema.index({ participantAId: 1, participantBId: 1 }, { unique: true });

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

const favoriteSchema = new Schema(
  {
    userId:         { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    favoriteUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["ACTIVE", "PAYMENT_LOCKED", "PAID"], default: "ACTIVE" },
    // 1st payment lock — 3-day window
    movedToPayment:      { type: Boolean, default: false },
    movedToPaymentAt:    { type: Date },
    paymentLockExpiresAt:{ type: Date }, // movedToPaymentAt + 3 days
    // After 1st payment approved, profile is in Inbox
    firstPaymentId:      { type: Schema.Types.ObjectId, ref: "Payment" },
    firstPaidAt:         { type: Date },
    inboxFrozenUntil:    { type: Date }, // +30 days after 1st payment approved
    // 2nd payment (contact details)
    movedToSecondPayment:    { type: Boolean, default: false },
    movedToSecondPaymentAt:  { type: Date },
    secondPaymentLockExpiresAt: { type: Date }, // +3 days
    secondPaymentId:     { type: Schema.Types.ObjectId, ref: "Payment" },
    secondPaidAt:        { type: Date },
    // Bride accepted / declined this groom's interest
    isAccepted:          { type: Boolean, default: false },
    acceptedAt:          { type: Date },
    declinedAt:          { type: Date },
  },
  { timestamps: true },
);
favoriteSchema.index({ userId: 1, favoriteUserId: 1 }, { unique: true });

const paymentSchema = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // For batch payments — multiple profile IDs paid at once
    receiverIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // Keep single receiverId for backward compat
    receiverId:  { type: Schema.Types.ObjectId, ref: "User" },
    amount:      { type: Number, required: true },
    // FIRST_PAYMENT = MD→AD, SECOND_PAYMENT = AD→CD
    tier: {
      type: String,
      enum: ["FIRST_PAYMENT", "SECOND_PAYMENT", "BASIC", "PROFILE_VIEW", "CONTACT_DETAILS"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    transactionId:  { type: String },
    paymentMethod:  { type: String },   // "gpay" | "upi" | "bank"
    paymentDate:    { type: Date },
    approvalStatus: {
      type: String,
      enum: ["PENDING_ADMIN_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING_ADMIN_REVIEW",
    },
    approvedBy:      { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt:      { type: Date },
    rejectionReason: { type: String },
    reviewedAt:      { type: Date },
    // After 1st payment approved — freeze profiles for 30 days
    frozenUntil:     { type: Date },
  },
  { timestamps: true },
);
paymentSchema.index({ approvalStatus: 1, createdAt: -1 });
// Note: userId already has index:true on the field — no separate schema.index() needed
paymentSchema.index({ receiverIds: 1 });
// Prevent the same UPI/bank transaction ID from being submitted and approved twice.
// sparse: true so null/missing transactionId records don't conflict.
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

const termsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    version: { type: String, default: "1.0" },
    acceptedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    reportedProfileId: { type: Schema.Types.ObjectId, ref: "Profile" },
    reason: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"], default: "OPEN", index: true },
    action: { type: String },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

const settingsSchema = new Schema(
  {
    paymentAmounts: {
      MC: { type: Number, default: 500 },
      UC: { type: Number, default: 2500 },
      EC: { type: Number, default: 5000 },
    },
    maintenanceMode:          { type: Boolean, default: false },
    maintenanceMessage:       { type: String,  default: "" },
    registrationOpen:         { type: Boolean, default: true },
    verificationRequired:     { type: Boolean, default: false },
    emailNotifications:       { type: Boolean, default: true },
    profileApprovalRequired:  { type: Boolean, default: false },
    contactDetailsGating:     { type: Boolean, default: true },
    paymentRequired:          { type: Boolean, default: true },
    // Payment collection details (shown on payment page)
    upiId:              { type: String, default: "reginmatrimony@upi" },
    bankName:           { type: String, default: "State Bank of India" },
    bankAccountNo:      { type: String, default: "" },
    bankIfsc:           { type: String, default: "" },
    bankAccountHolder:  { type: String, default: "Regin Matrimony Services" },
    // Auto-freeze thresholds (days of inactivity)
    groomFreezeDays:    { type: Number, default: 90 },
    brideFreezeDays:    { type: Number, default: 60 },
    updatedAt:          { type: Date, default: Date.now },
    updatedBy:          { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const auditLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId },
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

// ── PasswordOtp — temporary OTP store for forgot-password flow ───────────────
// TTL index auto-deletes the record after 10 minutes.
const passwordOtpSchema = new Schema({
  email:    { type: String, required: true, unique: true, index: true },
  otpHash:  { type: String, required: true },   // bcrypt-hashed 6-digit OTP
  attempts: { type: Number, default: 0 },        // max 5 wrong guesses
  expiresAt:{ type: Date,   required: true, index: { expireAfterSeconds: 0 } },
  createdAt:{ type: Date,   default: Date.now },
});

// ── PendingRegistration — temporary store during email OTP verification ──────
// TTL index on expiresAt auto-deletes unverified records after 10 minutes.
const pendingRegistrationSchema = new Schema({
  email:       { type: String, required: true, unique: true, index: true },
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  profileType: { type: String, enum: ["BRIDE", "GROOM"], required: true },
  familyClass: { type: String, enum: ["MC", "UC", "EC"], required: true },
  religion:    { type: String, enum: ["HINDU", "MUSLIM", "CHRISTIAN", "OTHER"], required: true },
  otpHash:     { type: String, required: true },  // bcrypt-hashed 6-digit OTP
  attempts:    { type: Number, default: 0 },       // wrong guesses, max 5
  expiresAt:   { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  createdAt:   { type: Date, default: Date.now },
});

export const PasswordOtpModel =
  (models && models["PasswordOtp"]) || model("PasswordOtp", passwordOtpSchema);
export const UserModel = (models && models["User"]) || model("User", userSchema);
export const ProfileModel = (models && models["Profile"]) || model("Profile", profileSchema);
export const PendingRegistrationModel =
  (models && models["PendingRegistration"]) ||
  model("PendingRegistration", pendingRegistrationSchema);
export const InterestModel = (models && models["Interest"]) || model("Interest", interestSchema);
export const ConversationModel = (models && models["Conversation"]) || model("Conversation", conversationSchema);
export const MessageModel = (models && models["Message"]) || model("Message", messageSchema);
export const FavoriteModel = (models && models["Favorite"]) || model("Favorite", favoriteSchema);
export const PaymentModel = (models && models["Payment"]) || model("Payment", paymentSchema);
export const TermsModel = (models && models["Terms"]) || model("Terms", termsSchema);
export const ReportModel = (models && models["Report"]) || model("Report", reportSchema);
export const SettingsModel = (models && models["Settings"]) || model("Settings", settingsSchema);
export const AuditLogModel = (models && models["AuditLog"]) || model("AuditLog", auditLogSchema);

// ── Notification ──────────────────────────────────────────────────────────────
const notificationSchema = new Schema(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "PAYMENT_APPROVED", "PAYMENT_REJECTED",
        "PROFILE_APPROVED", "PROFILE_REJECTED",
        "INTEREST_ACCEPTED", "INTEREST_DECLINED",
        "INTEREST_RECEIVED", "NEW_MESSAGE",
      ],
      required: true,
    },
    message:  { type: String, required: true },
    link:     { type: String },      // optional internal href
    isRead:   { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel =
  (models && models["Notification"]) || model("Notification", notificationSchema);

// ── Counter — atomic sequence generator (prevents profile ID race conditions) ─
const counterSchema = new Schema({
  _id: { type: String, required: true },  // counter name, e.g. "profileId"
  seq: { type: Number, default: 0 },
});
export const CounterModel =
  (models && models["Counter"]) || model("Counter", counterSchema);

export type UserDoc = InferSchemaType<typeof userSchema>;
export type ProfileDoc = InferSchemaType<typeof profileSchema>;
export type FavoriteDoc = InferSchemaType<typeof favoriteSchema>;
export type PaymentDoc = InferSchemaType<typeof paymentSchema>;
export type ReportDoc = InferSchemaType<typeof reportSchema>;
export type SettingsDoc = InferSchemaType<typeof settingsSchema>;
export type AuditLogDoc = InferSchemaType<typeof auditLogSchema>;
