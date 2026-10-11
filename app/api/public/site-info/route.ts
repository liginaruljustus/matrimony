/**
 * GET /api/public/site-info
 *
 * Public (no login): the support phone number and the fee amounts shown on the
 * home page. Deliberately exposes nothing else from Settings.
 */
import { getPublicSiteInfo } from "@/lib/siteInfo";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getPublicSiteInfo());
}
