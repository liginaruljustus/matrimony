/**
 * GET /api/admin/danger/preview?type=activity|profiles|users|factory
 *
 * Returns document counts that WOULD be deleted for a given reset type.
 * No data is modified — this is a pure dry-run used to populate the
 * confirmation modal before the admin commits.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  UserModel, ProfileModel, FavoriteModel, PaymentModel,
  InterestModel, ConversationModel, MessageModel,
  TermsModel, ReportModel, AuditLogModel,
  PasswordOtpModel, PendingRegistrationModel,
} from "@/lib/models";

export type ResetType = "activity" | "profiles" | "users" | "factory";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "") as ResetType;
  if (!["activity", "profiles", "users", "factory"].includes(type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  await connectToDatabase();

  // ── Level 1 counts (always included) ─────────────────────────────────────
  const [
    favorites, payments, interests,
    conversations, messages, terms,
    reports, auditLogs, passwordOtps, pendingRegs,
  ] = await Promise.all([
    FavoriteModel.countDocuments(),
    PaymentModel.countDocuments(),
    InterestModel.countDocuments(),
    ConversationModel.countDocuments(),
    MessageModel.countDocuments(),
    TermsModel.countDocuments(),
    ReportModel.countDocuments(),
    AuditLogModel.countDocuments(),
    PasswordOtpModel.countDocuments(),
    PendingRegistrationModel.countDocuments(),
  ]);

  const counts: Record<string, number> = {
    favorites, payments, interests,
    conversations, messages, terms,
    reports, auditLogs, passwordOtps, pendingRegs,
  };

  // ── Level 2: profiles ────────────────────────────────────────────────────
  if (type === "profiles" || type === "users" || type === "factory") {
    counts.profiles = await ProfileModel.countDocuments();

    // Count Cloudinary photos across all profiles
    const allProfiles = await ProfileModel.find({}).select("photos").lean() as any[];
    counts.cloudinaryPhotos = allProfiles.reduce(
      (sum, p) => sum + (p.photos?.length ?? 0), 0
    );
  }

  // ── Level 3: users (non-admin) ───────────────────────────────────────────
  if (type === "users" || type === "factory") {
    counts.users = await UserModel.countDocuments({ role: { $ne: "ADMIN" } });
  }

  // ── Level 4: factory — settings would be reset (not deleted) ────────────
  if (type === "factory") {
    counts.settingsWillReset = 1;
  }

  return Response.json({ type, counts });
}
