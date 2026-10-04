/**
 * One-off: older "accepted your proposal" notifications stored the bride's NAME.
 * The groom must only see her Profile ID before the Final Payment, so rewrite
 * those stored messages to use the Profile ID.
 *
 *   node scripts/fix-accept-notifications.js            # dry run (shows changes)
 *   node scripts/fix-accept-notifications.js --apply    # write changes
 *
 * Uses FIX_DATABASE_URL if set, otherwise DATABASE_URL from .env.local / .env.
 */
const fs = require("fs");
const mongoose = require("mongoose");

function readUrl() {
  if (process.env.FIX_DATABASE_URL) return process.env.FIX_DATABASE_URL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    const line = fs.readFileSync(file, "utf8").split(/\r?\n/)
      .find((l) => !l.trim().startsWith("#") && l.trim().startsWith("DATABASE_URL="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^"|"$/g, "");
  }
  throw new Error("DATABASE_URL is not set");
}

async function main() {
  const apply = process.argv.includes("--apply");
  await mongoose.connect(readUrl());
  const db = mongoose.connection.db;
  const N = db.collection("notifications"), F = db.collection("favorites"), U = db.collection("users");
  console.log(`database: ${db.databaseName} @ ${mongoose.connection.host}  (${apply ? "APPLY" : "dry run"})`);

  const olds = await N.find({ type: "INTEREST_ACCEPTED", message: { $not: /^(Bride |A bride )/ } }).toArray();
  let fixed = 0, skipped = 0;
  for (const n of olds) {
    const name = (n.message.match(/^(.*?) has accepted your proposal/) || [])[1];
    // Brides who accepted this groom and carry that name
    const favs = await F.find({ userId: n.userId, isAccepted: true }).toArray();
    const brides = await U.find({ _id: { $in: favs.map((f) => f.favoriteUserId) }, name }).toArray();
    // If the bride can't be identified (e.g. her account was removed), fall back to
    // a message with no name at all.
    const known = name && brides.length === 1 && brides[0].profileId;
    if (!known) skipped++;
    const message = known
      ? `Bride ${brides[0].profileId} has accepted your proposal! Open your Inbox to see the details.`
      : "A bride has accepted your proposal! Open your Inbox to see the details.";
    console.log(`FIX   ${n._id}  "${n.message}"  ->  "${message}"`);
    if (apply) await N.updateOne({ _id: n._id }, { $set: { message, link: "/inbox" } });
    fixed++;
  }
  console.log(`\n${olds.length} old notification(s): ${fixed} ${apply ? "fixed" : "to fix"} (${skipped} with a generic message)`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
