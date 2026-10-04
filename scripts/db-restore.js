/**
 * Restore a backup made by scripts/db-backup.js into another MongoDB database
 * (for example a cluster in a different Atlas account).
 *
 *   TARGET_DATABASE_URL="mongodb+srv://user:pass@host/matrimony" node scripts/db-restore.js <backup-folder>
 *
 * Safety:
 *  - The target comes ONLY from TARGET_DATABASE_URL, never from DATABASE_URL,
 *    so the live database cannot be overwritten by accident.
 *  - It refuses to run if any target collection already has documents, unless
 *    --force is given (which empties those collections first).
 *  - Documents keep their original _id, so references between collections hold.
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { EJSON } = require("bson");

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const dir = args.find((a) => !a.startsWith("--"));
  const target = process.env.TARGET_DATABASE_URL;
  if (!dir || !target) {
    console.error('Usage: TARGET_DATABASE_URL="..." node scripts/db-restore.js <backup-folder> [--force]');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  await mongoose.connect(target);
  const db = mongoose.connection.db;
  console.log(`Restoring backup of "${manifest.database}" (${manifest.takenAt}) into "${db.databaseName}"`);

  const names = Object.keys(manifest.collections);

  // Refuse to mix a backup into a database that already holds data
  const nonEmpty = [];
  for (const name of names) {
    if (await db.collection(name).countDocuments()) nonEmpty.push(name);
  }
  if (nonEmpty.length && !force) {
    console.error(`Target already has data in: ${nonEmpty.join(", ")}\nRe-run with --force to replace it.`);
    process.exit(1);
  }

  for (const name of names) {
    const col = db.collection(name);
    const docs = EJSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8"), { relaxed: false });
    const indexes = EJSON.parse(fs.readFileSync(path.join(dir, `${name}.indexes.json`), "utf8"), { relaxed: false });

    if (force) await col.deleteMany({});
    if (docs.length) await col.insertMany(docs, { ordered: true });
    else await db.createCollection(name).catch(() => {}); // keep empty collections too

    for (const { key, name: indexName, v, ns, background, ...options } of indexes) {
      if (indexName === "_id_") continue;
      await col.createIndex(key, { name: indexName, ...options });
    }

    const count = await col.countDocuments();
    const ok = count === manifest.collections[name].documents;
    console.log(`${name.padEnd(24)} ${String(count).padStart(6)} docs  ${ok ? "ok" : "MISMATCH"}`);
    if (!ok) process.exitCode = 1;
  }

  await mongoose.disconnect();
  console.log(process.exitCode ? "\nRestore finished with mismatches." : "\nRestore complete.");
}

main().catch((err) => { console.error(err); process.exit(1); });
