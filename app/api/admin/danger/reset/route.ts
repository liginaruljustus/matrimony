/**
 * POST /api/admin/danger/reset
 *
 * Executes a scoped data deletion. Four levels:
 *
 *  activity  — transactional data only (favorites, payments, messages, etc.)
 *  profiles  — activity + all profiles + Cloudinary photos
 *  users     — profiles + all non-admin user accounts
 *  factory   — users + reset Settings to defaults
 *
 * Body: { type: "activity"|"profiles"|"users"|"factory", confirm: string }
 * The confirm string must match the exact phrase for the chosen type.
 *
 * Admin accounts are NEVER deleted.
 * Settings are NEVER deleted (only reset on factory).
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  UserModel, ProfileModel, FavoriteModel, PaymentModel,
  InterestModel, ConversationModel, MessageModel,
  TermsModel, ReportModel, AuditLogModel,
  PasswordOtpModel, PendingRegistrationModel, SettingsModel,
} from "@/lib/models";
import { cloudinary } from "@/lib/cloudinary";

// Confirmation phrases — must match exactly (case-sensitive)
const CONFIRM_PHRASES: Record<string, string> = {
  activity: "DELETE ACTIVITY",
  profiles: "DELETE PROFILES",
  users:    "DELETE USERS",
  factory:  "FACTORY RESET",
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { type, confirm } = body as { type: string; confirm: string };

  if (!["activity", "profiles", "users", "factory"].includes(type)) {
    return Response.json({ error: "Invalid reset type." }, { status: 400 });
  }

  const required = CONFIRM_PHRASES[type];
  if (!confirm || confirm.trim() !== required) {
    return Response.json(
      { error: `Confirmation phrase must be exactly: ${required}` },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const deleted: Record<string, number> = {};

  // ── Level 1: Activity data ────────────────────────────────────────────────
  const [
    fav, pay, int_, conv, msg, terms, rep, otp, preg,
  ] = await Promise.all([
    FavoriteModel.deleteMany({}),
    PaymentModel.deleteMany({}),
    InterestModel.deleteMany({}),
    ConversationModel.deleteMany({}),
    MessageModel.deleteMany({}),
    TermsModel.deleteMany({}),
    ReportModel.deleteMany({}),
    PasswordOtpModel.deleteMany({}),
    PendingRegistrationModel.deleteMany({}),
  ]);

  deleted.favorites     = fav.deletedCount;
  deleted.payments      = pay.deletedCount;
  deleted.interests     = int_.deletedCount;
  deleted.conversations = conv.deletedCount;
  deleted.messages      = msg.deletedCount;
  deleted.terms         = terms.deletedCount;
  deleted.reports       = rep.deletedCount;
  deleted.passwordOtps  = otp.deletedCount;
  deleted.pendingRegs   = preg.deletedCount;

  // Clear AuditLog LAST so the deletion audit entry can still be written below
  // (we'll delete old logs but write a new one after all deletions)
  const oldAuditCount = await AuditLogModel.countDocuments();

  // ── Level 2: Profiles ─────────────────────────────────────────────────────
  if (type === "profiles" || type === "users" || type === "factory") {
    // Collect all Cloudinary photo URLs before deleting
    const profiles = await ProfileModel.find({}).select("photos").lean() as any[];
    const allUrls: string[] = profiles.flatMap((p) => p.photos ?? []);

    // Delete from Cloudinary
    let cloudinaryDeleted = 0;
    if (allUrls.length > 0) {
      try {
        // Delete entire folder (faster than per-URL deletes)
        await cloudinary.api.delete_resources_by_prefix("regin_matrimony/");
        cloudinaryDeleted = allUrls.length;
      } catch (err) {
        console.error("[Danger Reset] Cloudinary delete error:", err);
        // Non-fatal — continue with DB cleanup
      }
    }

    const profResult = await ProfileModel.deleteMany({});
    deleted.profiles       = profResult.deletedCount;
    deleted.cloudinaryPhotos = cloudinaryDeleted;

    // Reset profile-related fields on remaining users
    await UserModel.updateMany(
      { role: { $ne: "ADMIN" } },
      {
        $unset: {
          profileId: "", autoPassword: "", profileType: "",
          familyClass: "", isFrozen: "", frozenAt: "",
          isAutoFrozen: "", autoFrozenAt: "", lastActivity: "",
        },
      },
    );
  }

  // ── Level 3: Non-admin users ──────────────────────────────────────────────
  if (type === "users" || type === "factory") {
    const usersResult = await UserModel.deleteMany({ role: { $ne: "ADMIN" } });
    deleted.users = usersResult.deletedCount;
  }

  // ── Level 4: Factory — reset Settings to defaults ────────────────────────
  if (type === "factory") {
    await SettingsModel.findOneAndUpdate(
      {},
      {
        $set: {
          paymentAmounts:          { MC: 500, UC: 2500, EC: 5000 },
          maintenanceMode:         false,
          maintenanceMessage:      "",
          registrationOpen:        true,
          emailNotifications:      true,
          profileApprovalRequired: false,
          contactDetailsGating:    true,
          paymentRequired:         true,
          verificationRequired:    false,
          upiId:                   "reginmatrimony@upi",
          bankName:                "State Bank of India",
          bankAccountNo:           "",
          bankIfsc:                "",
          bankAccountHolder:       "Regin Matrimony Services",
          groomFreezeDays:         90,
          brideFreezeDays:         60,
          updatedAt:               new Date(),
        },
      },
      { upsert: true },
    );
    deleted.settingsReset = 1;
  }

  // ── Purge old audit logs + write the reset audit entry ───────────────────
  await AuditLogModel.deleteMany({});
  deleted.auditLogs = oldAuditCount;

  await AuditLogModel.create({
    adminId:    (session.user as any).id,
    action:     `DANGER_RESET_${type.toUpperCase()}`,
    targetType: "SYSTEM",
    changes: {
      before: { note: "Data existed before this reset." },
      after:  { deleted, resetAt: new Date().toISOString() },
    },
    timestamp: new Date(),
  });

  return Response.json({ ok: true, type, deleted });
}
