import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SettingsModel } from "@/lib/models";

const DEFAULTS = {
  firstPaymentAmounts: { MC: 500, UC: 2500, EC: 5000 },
  secondPaymentAmounts: { MC: 500, UC: 2500, EC: 5000 },
  maintenanceMode: false,
  maintenanceMessage: "",
  registrationOpen: true,
  emailNotifications: true,
  profileApprovalRequired: false,
  contactDetailsGating: true,
  paymentRequired: true,
  upiId: "luramatrimony@upi",
  adminPhone: "",
  paytmNumber: "",
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
  paymentLockDays: 3,
  inboxFreezeDays: 30,
  firstPaymentAutoApproveDays: 7,
  secondPaymentAutoApproveDays: 30,
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
      firstPaymentAmounts:   settings.firstPaymentAmounts   ?? DEFAULTS.firstPaymentAmounts,
      secondPaymentAmounts:  settings.secondPaymentAmounts  ?? DEFAULTS.secondPaymentAmounts,
      maintenanceMode:       settings.maintenanceMode       ?? false,
      maintenanceMessage:    settings.maintenanceMessage    ?? "",
      registrationOpen:      settings.registrationOpen      ?? true,
      emailNotifications:    settings.emailNotifications    ?? true,
      profileApprovalRequired: settings.profileApprovalRequired ?? false,
      contactDetailsGating:  settings.contactDetailsGating  ?? true,
      paymentRequired:       settings.paymentRequired       ?? true,
      verificationRequired:  settings.verificationRequired  ?? false,
      upiId:                 settings.upiId                 ?? DEFAULTS.upiId,
      adminPhone:            settings.adminPhone            ?? DEFAULTS.adminPhone,
      paytmNumber:           settings.paytmNumber           ?? DEFAULTS.paytmNumber,
      bankName:              settings.bankName              ?? DEFAULTS.bankName,
      bankAccountNo:         settings.bankAccountNo         ?? "",
      bankIfsc:              settings.bankIfsc              ?? "",
      bankAccountHolder:     settings.bankAccountHolder     ?? DEFAULTS.bankAccountHolder,
      groomFreezeDays:       settings.groomFreezeDays       ?? 90,
      activationEnabled:     settings.activationEnabled     ?? true,
      activationDays:        settings.activationDays        ?? 60,
      activationNcsDays:     settings.activationNcsDays     ?? 45,
      activationAllDoneDays: settings.activationAllDoneDays ?? 0,
      ncsSiteUrl:            settings.ncsSiteUrl            ?? "https://loorancsc.in",
      socialLinks:           settings.socialLinks           ?? [],
      promoItems:            settings.promoItems            ?? [],
      promoRotateDays:       settings.promoRotateDays       ?? 5,
      shareReminderDays:     settings.shareReminderDays     ?? 10,
      shareFreezeDays:       settings.shareFreezeDays       ?? 30,
      shareMaxSkips:         settings.shareMaxSkips         ?? 2,
      brideFreezeDays:       settings.brideFreezeDays       ?? 60,
      pdfDownloadEnabled:    settings.pdfDownloadEnabled    ?? true,
      pdfCompanyName:        settings.pdfCompanyName        ?? DEFAULTS.pdfCompanyName,
      pdfFooterText:         settings.pdfFooterText         ?? DEFAULTS.pdfFooterText,
      pdfShowContactDetails: settings.pdfShowContactDetails ?? true,
      pdfShowAstrology:      settings.pdfShowAstrology      ?? true,
      paymentLockDays:       settings.paymentLockDays       ?? 3,
      inboxFreezeDays:       settings.inboxFreezeDays       ?? 30,
      firstPaymentAutoApproveDays:  settings.firstPaymentAutoApproveDays  ?? 7,
      secondPaymentAutoApproveDays: settings.secondPaymentAutoApproveDays ?? 30,
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
    if (body.firstPaymentAmounts) {
      allowed.firstPaymentAmounts = {
        MC: Number(body.firstPaymentAmounts.MC) || 500,
        UC: Number(body.firstPaymentAmounts.UC) || 2500,
        EC: Number(body.firstPaymentAmounts.EC) || 5000,
      };
    }
    if (body.secondPaymentAmounts) {
      allowed.secondPaymentAmounts = {
        MC: Number(body.secondPaymentAmounts.MC) || 500,
        UC: Number(body.secondPaymentAmounts.UC) || 2500,
        EC: Number(body.secondPaymentAmounts.EC) || 5000,
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
    if ("adminPhone"        in body) allowed.adminPhone        = String(body.adminPhone ?? "").slice(0, 20);
    if ("paytmNumber"       in body) allowed.paytmNumber       = String(body.paytmNumber ?? "").slice(0, 20);
    if ("bankName"          in body) allowed.bankName          = String(body.bankName ?? "");
    if ("bankAccountNo"     in body) allowed.bankAccountNo     = String(body.bankAccountNo ?? "");
    if ("bankIfsc"          in body) allowed.bankIfsc          = String(body.bankIfsc ?? "");
    if ("bankAccountHolder" in body) allowed.bankAccountHolder = String(body.bankAccountHolder ?? "");
    if ("groomFreezeDays"   in body) allowed.groomFreezeDays   = Math.max(1, Number(body.groomFreezeDays) || 90);
    if ("brideFreezeDays"   in body) allowed.brideFreezeDays   = Math.max(1, Number(body.brideFreezeDays) || 60);
    // Go-live activation & sharing
    const days = (v: unknown, def: number, min = 1) => Math.max(min, Math.min(3650, Math.round(Number(v)) || def));
    if ("activationEnabled"     in body) allowed.activationEnabled     = Boolean(body.activationEnabled);
    if ("activationDays"        in body) allowed.activationDays        = days(body.activationDays, 60);
    if ("activationNcsDays"     in body) allowed.activationNcsDays     = days(body.activationNcsDays, 45, 0);
    if ("activationAllDoneDays" in body) allowed.activationAllDoneDays = days(body.activationAllDoneDays, 0, 0);
    if ("promoRotateDays"       in body) allowed.promoRotateDays       = days(body.promoRotateDays, 5);
    if ("shareReminderDays"     in body) allowed.shareReminderDays     = days(body.shareReminderDays, 10);
    if ("shareFreezeDays"       in body) allowed.shareFreezeDays       = days(body.shareFreezeDays, 30);
    if ("shareMaxSkips"         in body) allowed.shareMaxSkips         = Math.max(0, Math.min(10, Math.round(Number(body.shareMaxSkips)) || 0));
    if ("ncsSiteUrl"            in body) allowed.ncsSiteUrl            = String(body.ncsSiteUrl ?? "").trim().slice(0, 200);
    const cleanUrl = (u: unknown) => {
      const v = String(u ?? "").trim().slice(0, 500);
      return /^https?:\/\//i.test(v) ? v : "";
    };
    if (Array.isArray(body.socialLinks)) {
      allowed.socialLinks = body.socialLinks
        .map((l: any) => ({ name: String(l?.name ?? "").trim().slice(0, 60), url: cleanUrl(l?.url) }))
        .filter((l: any) => l.name && l.url)
        .slice(0, 20);
    }
    if (Array.isArray(body.promoItems)) {
      allowed.promoItems = body.promoItems
        .map((it: any) => ({
          category:  String(it?.category ?? "").trim().slice(0, 30),
          title:     String(it?.title ?? "").trim().slice(0, 120),
          mediaUrl:  cleanUrl(it?.mediaUrl),
          shareText: String(it?.shareText ?? "").trim().slice(0, 500),
        }))
        .filter((it: any) => it.mediaUrl || it.title)
        .slice(0, 50);
    }
    if ("pdfDownloadEnabled"    in body) allowed.pdfDownloadEnabled    = Boolean(body.pdfDownloadEnabled);
    if ("pdfShowContactDetails" in body) allowed.pdfShowContactDetails = Boolean(body.pdfShowContactDetails);
    if ("pdfShowAstrology"      in body) allowed.pdfShowAstrology      = Boolean(body.pdfShowAstrology);
    if ("pdfCompanyName"        in body) allowed.pdfCompanyName        = String(body.pdfCompanyName ?? "").slice(0, 80);
    if ("pdfFooterText"         in body) allowed.pdfFooterText         = String(body.pdfFooterText ?? "").slice(0, 120);
    if ("paymentLockDays"       in body) allowed.paymentLockDays       = Math.max(1, Number(body.paymentLockDays) || 3);
    if ("inboxFreezeDays"       in body) allowed.inboxFreezeDays       = Math.max(1, Number(body.inboxFreezeDays) || 30);
    if ("firstPaymentAutoApproveDays"  in body) allowed.firstPaymentAutoApproveDays  = Math.max(1, Number(body.firstPaymentAutoApproveDays) || 7);
    if ("secondPaymentAutoApproveDays" in body) allowed.secondPaymentAutoApproveDays = Math.max(1, Number(body.secondPaymentAutoApproveDays) || 30);

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
