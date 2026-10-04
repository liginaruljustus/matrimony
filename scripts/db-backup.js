/**
 * Back up the whole MongoDB database to a folder of files.
 *
 *   node scripts/db-backup.js [output-folder]
 *
 * Reads DATABASE_URL from the environment, or from .env.local / .env.
 * Writes one <collection>.json per collection (Extended JSON, so ObjectIds and
 * dates survive a round trip), its indexes as <collection>.indexes.json, and a
 * manifest.json with document counts.
 *
 * The output contains personal data and password hashes — keep it out of git.
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = require("bson");

function readUrl(name) {
  if (process.env[name]) return process.env[name];
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    const line = fs.readFileSync(file, "utf8").split(/\r?\n/)
      .find((l) => !l.trim().startsWith("#") && l.trim().startsWith(`${name}=`));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^"|"$/g, "");
  }
  throw new Error(`${name} is not set`);
}

async function main() {
  const stamp = new Date().toISOString().slice(0, 10);
  const outDir = path.resolve(process.argv[2] || `../mongodb-backup-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  await mongoose.connect(readUrl("DATABASE_URL"));
  const db = mongoose.connection.db;
  const manifest = { database: db.databaseName, takenAt: new Date().toISOString(), collections: {} };

  for (const { name } of await db.listCollections().toArray()) {
    const col = db.collection(name);
    const docs = await col.find({}).toArray();
    const indexes = await col.indexes();
    fs.writeFileSync(path.join(outDir, `${name}.json`), EJSON.stringify(docs, null, 2, { relaxed: false }));
    fs.writeFileSync(path.join(outDir, `${name}.indexes.json`), EJSON.stringify(indexes, null, 2, { relaxed: false }));
    manifest.collections[name] = { documents: docs.length, indexes: indexes.length };
    console.log(`${name.padEnd(24)} ${String(docs.length).padStart(6)} docs  ${indexes.length} indexes`);
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nBackup written to ${outDir}`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
