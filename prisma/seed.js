const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: { type: String, default: "USER" },
  },
  { timestamps: true },
);

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    age: Number,
    religion: String,
    caste: String,
    location: String,
    education: String,
    income: Number,
    bio: String,
    photos: [String],
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Profile = mongoose.models.Profile || mongoose.model("Profile", profileSchema);

async function findOrCreateUser({ name, email, passwordHash, role = "USER" }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ name, email, passwordHash, role });
}

async function findOrCreateProfile({ userId, age, religion, caste, location, education, income, bio }) {
  const existing = await Profile.findOne({ userId });
  if (existing) return existing;
  return Profile.create({ userId, age, religion, caste, location, education, income, bio, photos: [] });
}

async function main() {
  const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/matrimony";
  await mongoose.connect(uri, { dbName: "matrimony" });

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const userPassword = await bcrypt.hash("User@1234", 10);

  const admin = await findOrCreateUser({
    name: "Admin User",
    email: "admin@matrimony.app",
    passwordHash: adminPassword,
    role: "ADMIN",
  });

  const demoUsers = [
    {
      name: "Priya Sharma",
      email: "priya@example.com",
      age: 27,
      religion: "Hindu",
      caste: "Brahmin",
      location: "Bangalore",
      education: "MBA",
      income: 1800000,
      bio: "Product manager who loves travel and classical music.",
    },
    {
      name: "Arjun Mehta",
      email: "arjun@example.com",
      age: 30,
      religion: "Hindu",
      caste: "Vaishya",
      location: "Pune",
      education: "B.Tech",
      income: 2400000,
      bio: "Engineering leader and weekend trekker.",
    },
  ];

  for (const item of demoUsers) {
    const user = await findOrCreateUser({
      name: item.name,
      email: item.email,
      passwordHash: userPassword,
    });

    await findOrCreateProfile({
      userId: user.id,
      age: item.age,
      religion: item.religion,
      caste: item.caste,
      location: item.location,
      education: item.education,
      income: item.income,
      bio: item.bio,
    });
  }

  await findOrCreateProfile({
    userId: admin.id,
    age: 35,
    religion: "Hindu",
    caste: "N/A",
    location: "Delhi",
    education: "MCA",
    income: 3000000,
    bio: "Admin profile for moderation.",
  });
}

main()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await mongoose.disconnect();
    process.exit(1);
  });
