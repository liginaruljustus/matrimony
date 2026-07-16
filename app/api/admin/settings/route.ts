import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SettingsModel } from "@/lib/models";

const DEFAULTS = {
  paymentAmounts: { MC: 500, UC: 2500, EC: 5000 },
  maintenanceMode: false,
  maintenanceMessage: "",
  registrationOpen: true,
  emailNotifications: true,
  profileApprovalRequired: false,
  contactDetailsGating: true,
  paymentRequired: true,
  upiId: "luramatrimony@upi",
  bankName: "State Bank of India",
  bankAccountNo: "",
  bankIfsc: "",
  bankAccountHolder: "Lura Matrimony Services",
  groomFreezeDays: 90,
  brideFreezeDays: 60,
  verificationRequired: false,
  pdfDownloadEnabled: true,
  pdfCompanyName: "Lura Matrimony",
  pdfFooterText: "Confidential — For Family Use Only",
  pdfShowContactDetails: true,
  pdfShowAstrology: true,
  favoriteTrialDays: 7,
  paymentLockDays: 3,
  inboxFreezeDays: 30,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const settings = await SettingsModel.findOne().lean<any>();
    if (!settings) {
      // Return defaults — no record yet
      return Response.json(DEFAULTS);
    }

    return Response.json({
      paymentAmounts:        settings.paymentAmounts        ?? DEFAULTS.paymentAmounts,
      maintenanceMode:       settings.maintenanceMode       ?? false,
      maintenanceMessage:    settings.maintenanceMessage    ?? "",
      registrationOpen:      settings.registrationOpen      ?? true,
      emailNotifications:    settings.emailNotifications    ?? true,
      profileApprovalRequired: settings.profileApprovalRequired ?? false,
      contactDetailsGating:  settings.contactDetailsGating  ?? true,
      paymentRequired:       settings.paymentRequired       ?? true,
      verificationRequired:  settings.verificationRequired  ?? false,
      upiId:                 settings.upiId                 ?? DEFAULTS.upiId,
      bankName:              settings.bankName              ?? DEFAULTS.bankName,
      bankAccountNo:         settings.bankAccountNo         ?? "",
      bankIfsc:              settings.bankIfsc              ?? "",
      bankAccountHolder:     settings.bankAccountHolder     ?? DEFAULTS.bankAccountHolder,
      groomFreezeDays:       settings.groomFreezeDays       ?? 90,
      brideFreezeDays:       settings.brideFreezeDays       ?? 60,
      pdfDownloadEnabled:    settings.pdfDownloadEnabled    ?? true,
      pdfCompanyName:        settings.pdfCompanyName        ?? DEFAULTS.pdfCompanyName,
      pdfFooterText:         settings.pdfFooterText         ?? DEFAULTS.pdfFooterText,
      pdfShowContactDetails: settings.pdfShowContactDetails ?? true,
      pdfShowAstrology:      settings.pdfShowAstrology      ?? true,
      favoriteTrialDays:     settings.favoriteTrialDays     ?? 7,
      paymentLockDays:       settings.paymentLockDays       ?? 3,
      inboxFreezeDays:       settings.inboxFreezeDays       ?? 30,
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return Response.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Whitelist fields — never allow arbitrary keys
    const allowed: Record<string, unknown> = {};
    if (body.paymentAmounts) {
      allowed.paymentAmounts = {
        MC: Number(body.paymentAmounts.MC) || 500,
        UC: Number(body.paymentAmounts.UC) || 2500,
        EC: Number(body.paymentAmounts.EC) || 5000,
      };
    }
    const boolFields = [
      "maintenanceMode",
      "registrationOpen",
      "emailNotifications",
      "profileApprovalRequired",
      "contactDetailsGating",
      "paymentRequired",
      "verificationRequired",
    ] as const;
    for (const f of boolFields) {
      if (f in body) allowed[f] = Boolean(body[f]);
    }
    if ("maintenanceMessage" in body) allowed.maintenanceMessage = String(body.maintenanceMessage ?? "");
    if ("upiId"             in body) allowed.upiId             = String(body.upiId ?? "");
    if ("bankName"          in body) allowed.bankName          = String(body.bankName ?? "");
    if ("bankAccountNo"     in body) allowed.bankAccountNo     = String(body.bankAccountNo ?? "");
    if ("bankIfsc"          in body) allowed.bankIfsc          = String(body.bankIfsc ?? "");
    if ("bankAccountHolder" in body) allowed.bankAccountHolder = String(body.bankAccountHolder ?? "");
    if ("groomFreezeDays"   in body) allowed.groomFreezeDays   = Math.max(1, Number(body.groomFreezeDays) || 90);
    if ("brideFreezeDays"   in body) allowed.brideFreezeDays   = Math.max(1, Number(body.brideFreezeDays) || 60);
    if ("pdfDownloadEnabled"    in body) allowed.pdfDownloadEnabled    = Boolean(body.pdfDownloadEnabled);
    if ("pdfShowContactDetails" in body) allowed.pdfShowContactDetails = Boolean(body.pdfShowContactDetails);
    if ("pdfShowAstrology"      in body) allowed.pdfShowAstrology      = Boolean(body.pdfShowAstrology);
    if ("pdfCompanyName"        in body) allowed.pdfCompanyName        = String(body.pdfCompanyName ?? "").slice(0, 80);
    if ("pdfFooterText"         in body) allowed.pdfFooterText         = String(body.pdfFooterText ?? "").slice(0, 120);
    if ("favoriteTrialDays"     in body) allowed.favoriteTrialDays     = Math.max(1, Number(body.favoriteTrialDays) || 7);
    if ("paymentLockDays"       in body) allowed.paymentLockDays       = Math.max(1, Number(body.paymentLockDays) || 3);
    if ("inboxFreezeDays"       in body) allowed.inboxFreezeDays       = Math.max(1, Number(body.inboxFreezeDays) || 30);

    allowed.updatedAt = new Date();
    allowed.updatedBy = (session.user as any).id;

    await connectToDatabase();

    await SettingsModel.findOneAndUpdate(
      {},
      { $set: allowed },
      { upsert: true, new: true },
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/settings error:", error);
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
