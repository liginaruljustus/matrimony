"use client";

import {
  Document, Page, View, Text, StyleSheet, Font, Image,
  pdf,
} from "@react-pdf/renderer";

// ── Styles ──────────────────────────────────────────────────────────────────

const MAROON  = "#7a1f2b";
const GOLD    = "#d4af37";
const NEUTRAL = "#374151";
const LIGHT   = "#f9f5f0";
const BORDER  = "#e5e7eb";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 50,
  },

  // ── Header band ────────────────────────────────────────────────────────────
  header: {
    backgroundColor: MAROON,
    marginHorizontal: -32,
    marginTop: -20,
    padding: "22 32 18 32",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  // Wrapper clips the image to borderRadius (react-pdf Image ignores borderRadius alone)
  headerPhotoWrapper: {
    width: 96,
    height: 96,
    borderRadius: 8,
    border: `2 solid ${GOLD}`,
    overflow: "hidden",
    backgroundColor: "#5c1520",
    alignItems: "center",
    justifyContent: "center",
  },
  headerPhoto: {
    width: 92,
    height: 92,
    // "contain" shows the FULL image (no cropping) — letterboxed on maroon background
    objectFit: "contain",
    objectPosition: "center center",
  },
  headerPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    border: `2 solid ${GOLD}`,
    backgroundColor: "#5c1520",
    alignItems: "center",
    justifyContent: "center",
  },
  headerPhotoInitial: {
    fontSize: 32,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
  },
  photoHint: {
    fontSize: 6.5,
    color: GOLD,
    marginTop: 4,
    textAlign: "center",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 22,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  headerSub: {
    fontSize: 10,
    color: GOLD,
    marginBottom: 2,
  },
  headerBadge: {
    marginTop: 6,
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  headerBadgeText: {
    fontSize: 8,
    color: MAROON,
    fontFamily: "Helvetica-Bold",
  },

  // ── Gold divider under header ───────────────────────────────────────────────
  goldBar: {
    height: 4,
    backgroundColor: GOLD,
    marginHorizontal: -32,
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    paddingTop: 16,
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: MAROON,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottom: `1.5 solid ${MAROON}`,
    paddingBottom: 3,
    marginBottom: 8,
  },

  // ── Two-column grid inside a section ───────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  fieldBox: {
    width: "50%",
    paddingRight: 8,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 7.5,
    color: "#9ca3af",
    marginBottom: 1.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 9.5,
    color: NEUTRAL,
    fontFamily: "Helvetica",
  },
  fieldValueBold: {
    fontSize: 9.5,
    color: NEUTRAL,
    fontFamily: "Helvetica-Bold",
  },

  // ── Full-width text block ─────────────────────────────────────────────────
  fullWidth: {
    width: "100%",
    marginBottom: 6,
  },
  blockText: {
    fontSize: 9.5,
    color: NEUTRAL,
    lineHeight: 1.55,
  },

  // ── Repeating page header band (matches footer design) ─────────────────────
  photoPage: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingHorizontal: 32,
    paddingTop: 58,
    paddingBottom: 50,
  },
  pageHeaderBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 34,
    backgroundColor: MAROON,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  pageHeaderBrand: {
    fontSize: 10,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  pageHeaderTitle: {
    fontSize: 8,
    color: "#ffffff",
  },
  pageHeaderGold: {
    position: "absolute",
    top: 34,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: GOLD,
  },
  mainPhotoFrame: {
    width: "100%",
    height: 480,
    border: `1 solid ${BORDER}`,
    borderRadius: 8,
    backgroundColor: LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  mainPhoto: {
    width: "100%",
    height: 478,
    objectFit: "contain",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridPhotoFrame: {
    width: "48.5%",
    height: 220,
    border: `1 solid ${BORDER}`,
    borderRadius: 8,
    backgroundColor: LIGHT,
    marginBottom: 10,
    overflow: "hidden",
  },
  gridPhoto: {
    width: "100%",
    height: 218,
    objectFit: "contain",
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: LIGHT,
    borderTop: `1 solid ${BORDER}`,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
  footerBrand: {
    fontSize: 8,
    color: MAROON,
    fontFamily: "Helvetica-Bold",
  },
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmt  = (v: any) => (v !== null && v !== undefined && v !== "" ? String(v) : "—");
const fmtH = (v: any) => (v ? `${v} cm` : "—");
const fmtW = (v: any) => (v ? `${v} kg` : "—");
const fmtI = (v: any) => (v != null && v !== "" ? `₹${Number(v).toLocaleString("en-IN")}/month` : "—");
const fmtFS = (v: any) =>
  v === "MC" ? "Middle Class" : v === "UC" ? "Upper Class" : v === "EC" ? "Elite Class" : fmt(v);
const fmtDOB = (v: any) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch { return fmt(v); }
};

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Approved",
  PENDING_APPROVAL: "Pending Approval",
  DRAFT: "Draft",
  REJECTED: "Rejected",
  FLAGGED: "Flagged",
};

// ── Field component ──────────────────────────────────────────────────────────

function Field({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={bold ? styles.fieldValueBold : styles.fieldValue}>{value}</Text>
    </View>
  );
}

// ── PDF settings type ────────────────────────────────────────────────────────

export type PdfSettings = {
  pdfCompanyName: string;
  pdfFooterText: string;
  pdfShowContactDetails: boolean;
  pdfShowAstrology: boolean;
};

const PDF_DEFAULTS: PdfSettings = {
  pdfCompanyName: "Regin Matrimony",
  pdfFooterText: "Confidential — For Family Use Only",
  pdfShowContactDetails: true,
  pdfShowAstrology: true,
};

// ── PDF Document ─────────────────────────────────────────────────────────────

function ProfileDocument({ profile, user, pdfSettings }: { profile: any; user: any; pdfSettings: PdfSettings }) {
  const p = profile ?? {};
  const cfg        = pdfSettings;
  const name       = user?.name ?? p.name ?? "Profile";
  const profileId  = user?.profileId ?? "—";
  const status     = STATUS_LABEL[p.profileStatus] ?? "Draft";
  const initial    = name.charAt(0).toUpperCase();
  const photos: string[] = Array.isArray(p.photos) ? p.photos : [];
  const mainPhoto  = photos[0];

  return (
    <Document title={`${name} — ${cfg.pdfCompanyName} Profile`} author={cfg.pdfCompanyName}>
      <Page size="A4" style={styles.page}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          {mainPhoto ? (
            <View style={{ alignItems: "center" }}>
              <View style={styles.headerPhotoWrapper}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={mainPhoto} style={styles.headerPhoto} />
              </View>
              <Text style={styles.photoHint}>Full photo on last page »</Text>
            </View>
          ) : (
            <View style={styles.headerPhotoPlaceholder}>
              <Text style={styles.headerPhotoInitial}>{initial}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{name}</Text>
            <Text style={styles.headerSub}>Profile ID: {profileId}</Text>
            <Text style={styles.headerSub}>
              {p.age ? `${p.age} yrs  ·  ` : ""}
              {p.religion ?? ""}
              {p.caste ? `  ·  ${p.caste}` : ""}
            </Text>
            {p.location && <Text style={styles.headerSub}>{p.location}</Text>}
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={styles.goldBar} />

        {/* ── Body ────────────────────────────────────────────────────── */}
        <View style={styles.body}>

          {/* Personal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.grid}>
              <Field label="Date of Birth"     value={fmtDOB(p.dateOfBirth)} />
              <Field label="Age"               value={p.age ? `${p.age} years` : "—"} />
              <Field label="Gender"            value={p.gender === "MALE" ? "Male" : p.gender === "FEMALE" ? "Female" : fmt(p.gender)} />
              <Field label="Marital Status"    value={fmt(p.maritalStatus)} />
              <Field label="Height"            value={fmtH(p.height)} />
              <Field label="Weight"            value={fmtW(p.weight)} />
              <Field label="Complexion"        value={fmt(p.complexion)} />
              <Field label="Physically Challenged" value={p.physicallyChallenge != null ? (p.physicallyChallenge ? "Yes" : "No") : "—"} />
              <Field label="Religion"          value={fmt(p.religion)} />
              <Field label="Caste"             value={fmt(p.caste)} bold />
              <Field label="Sub-Caste"         value={fmt(p.subCaste)} />
              <Field label="Mother Tongue"     value={fmt(p.motherTongue)} />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.grid}>
              <Field label="Native District"   value={fmt(p.nativeDistrict)} />
              <Field label="Current Location"  value={fmt(p.location)} />
              <Field label="Place of Birth"    value={fmt(p.placeOfBirth)} />
              <Field label="Time of Birth"     value={fmt(p.timeOfBirth)} />
            </View>
            {p.address && (
              <View style={styles.fullWidth}>
                <Text style={styles.fieldLabel}>Address</Text>
                <Text style={styles.blockText}>{p.address}</Text>
              </View>
            )}
          </View>

          {/* Education & Career */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education & Career</Text>
            <View style={styles.grid}>
              <Field label="Education"         value={fmt(p.education)} bold />
              <Field label="Current Job"       value={fmt(p.currentJob)} />
              <Field label="Monthly Income"    value={fmtI(p.monthlyIncome ?? p.income)} />
            </View>
          </View>

          {/* Astrology — controlled by pdfShowAstrology */}
          {cfg.pdfShowAstrology && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Astrological Details</Text>
              <View style={styles.grid}>
                <Field label="Rashi"             value={fmt(p.rashi)} />
                <Field label="Nakshatra"         value={fmt(p.nakshatra)} />
                <Field label="Lagnam"            value={fmt(p.lagnam)} />
                <Field label="Place of Birth"    value={fmt(p.placeOfBirth)} />
                <Field label="Time of Birth"     value={fmt(p.timeOfBirth)} />
              </View>
            </View>
          )}

          {/* Family */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Family Details</Text>
            <View style={styles.grid}>
              <Field label="Father's Name"        value={fmt(p.fatherName)} />
              <Field label="Father's Occupation"  value={fmt(p.fatherOccupation)} />
              <Field label="Mother's Name"        value={fmt(p.motherName)} />
              <Field label="Mother's Occupation"  value={fmt(p.motherOccupation)} />
              <Field label="Brothers (Total)"     value={fmt(p.totalBrothers)} />
              <Field label="Brothers (Married)"   value={fmt(p.marriedBrothers)} />
              <Field label="Sisters (Total)"      value={fmt(p.totalSisters)} />
              <Field label="Sisters (Married)"    value={fmt(p.marriedSisters)} />
              <Field label="Family Status"        value={fmtFS(p.familyStatus)} />
              <Field label="House Details"        value={fmt(p.houseDetails)} />
            </View>
          </View>

          {/* Contact — controlled by pdfShowContactDetails */}
          {cfg.pdfShowContactDetails && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Person</Text>
              <View style={styles.grid}>
                <Field label="Contact Name"      value={fmt(p.contactPersonName)} />
                <Field label="Phone"             value={fmt(p.contactNumber)} />
                <Field label="WhatsApp"          value={fmt(p.whatsappNo)} />
              </View>
            </View>
          )}

          {/* Bio */}
          {(p.bio || p.expectations) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About & Expectations</Text>
              {p.bio && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.fieldLabel}>About Me</Text>
                  <Text style={styles.blockText}>{p.bio}</Text>
                </View>
              )}
              {p.expectations && (
                <View>
                  <Text style={styles.fieldLabel}>Partner Expectations</Text>
                  <Text style={styles.blockText}>{p.expectations}</Text>
                </View>
              )}
            </View>
          )}

        </View>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
          <Text style={styles.footerBrand}>{cfg.pdfCompanyName}</Text>
          <Text style={styles.footerText}>{cfg.pdfFooterText}</Text>
        </View>

      </Page>

      {/* ── Photos page — full uncropped photos ─────────────────────────── */}
      {photos.length > 0 && (
        <Page size="A4" style={styles.photoPage}>
          {/* Repeating header band — mirrors the footer design */}
          <View style={styles.pageHeaderBand} fixed>
            <Text style={styles.pageHeaderBrand}>{cfg.pdfCompanyName.toUpperCase()}</Text>
            <Text style={styles.pageHeaderTitle}>Photos — {name} ({profileId})</Text>
          </View>
          <View style={styles.pageHeaderGold} fixed />

          {/* Main photo, full size, no cropping */}
          <View style={styles.mainPhotoFrame}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={photos[0]} style={styles.mainPhoto} />
          </View>

          {/* Additional photos in a 2-column grid */}
          {photos.length > 1 && (
            <View style={styles.photoGrid}>
              {photos.slice(1).map((photo, i) => (
                <View key={i} style={styles.gridPhotoFrame}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={photo} style={styles.gridPhoto} />
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
              Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
            <Text style={styles.footerBrand}>{cfg.pdfCompanyName}</Text>
            <Text style={styles.footerText}>{cfg.pdfFooterText}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}

// ── Download trigger ──────────────────────────────────────────────────────────

export async function downloadProfilePDF(profile: any, user: any, pdfSettings?: Partial<PdfSettings>) {
  const cfg = { ...PDF_DEFAULTS, ...pdfSettings };
  const blob = await pdf(<ProfileDocument profile={profile} user={user} pdfSettings={cfg} />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${user?.name ?? "profile"}-regin-matrimony.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
