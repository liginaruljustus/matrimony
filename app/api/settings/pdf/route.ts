import { connectToDatabase } from "@/lib/mongodb";
import { SettingsModel } from "@/lib/models";

const DEFAULTS = {
  pdfDownloadEnabled: true,
  pdfCompanyName: "Regin Matrimony",
  pdfFooterText: "Confidential — For Family Use Only",
  pdfShowContactDetails: true,
  pdfShowAstrology: true,
};

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await SettingsModel.findOne()
      .select("pdfDownloadEnabled pdfCompanyName pdfFooterText pdfShowContactDetails pdfShowAstrology")
      .lean<any>();

    if (!settings) return Response.json(DEFAULTS);

    return Response.json({
      pdfDownloadEnabled:    settings.pdfDownloadEnabled    ?? DEFAULTS.pdfDownloadEnabled,
      pdfCompanyName:        settings.pdfCompanyName        ?? DEFAULTS.pdfCompanyName,
      pdfFooterText:         settings.pdfFooterText         ?? DEFAULTS.pdfFooterText,
      pdfShowContactDetails: settings.pdfShowContactDetails ?? DEFAULTS.pdfShowContactDetails,
      pdfShowAstrology:      settings.pdfShowAstrology      ?? DEFAULTS.pdfShowAstrology,
    });
  } catch {
    return Response.json(DEFAULTS);
  }
}
