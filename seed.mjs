// Run: node seed.mjs
// Creates the first admin user in the database.
// Edit the values below before running.

const DOMAIN   = "https://YOUR-DOMAIN.vercel.app"; // ← change this
const SECRET   = "regin-seed-2026";                // ← must match SEED_SECRET in Vercel
const EMAIL    = "admin@test.com";
const PASSWORD = "Test@12345";
const NAME     = "Admin";

const res = await fetch(`${DOMAIN}/api/admin/seed`, {
  method:  "POST",
  headers: { "Content-Type": "application/json" },
  body:    JSON.stringify({ secret: SECRET, email: EMAIL, password: PASSWORD, name: NAME }),
});

const data = await res.json();
console.log("Status:", res.status);
console.log("Response:", JSON.stringify(data, null, 2));
