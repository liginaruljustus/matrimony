import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";
import { registerWithRoleSchema } from "@/lib/validators";
import { generateProfileId, generatePassword } from "@/lib/profileIdGenerator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerWithRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const existing = await UserModel.findOne({ email: parsed.data.email }).lean();
    if (existing) {
      return NextResponse.json({ message: "Email already exists" }, { status: 409 });
    }

    // Auto-generate password from phone + date + name
    const submissionDate = new Date();
    const firstName = parsed.data.name.split(" ")[0];
    const autoPassword = generatePassword(parsed.data.phone, submissionDate, firstName);

    // Hash the auto-generated password for storage
    const passwordHash = await bcrypt.hash(autoPassword, 10);

    // Generate Profile ID
    // Religion is collected later in the profile form, so we use "OTHER" as
    // the neutral default — the sequence number + familyClass uniquely identify
    // the user; religion in the ID is cosmetic only.
    const profileId = await generateProfileId(
      parsed.data.profileType === "BRIDE" ? "FEMALE" : "MALE",
      "OTHER",
      parsed.data.familyClass,
    );

    const user = await UserModel.create({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
      profileId,
      autoPassword,
      profileType: parsed.data.profileType,
      familyClass: parsed.data.familyClass,
    });

    return NextResponse.json(
      {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          profileId: user.profileId,
          autoPassword: user.autoPassword,
        },
        message: "Registration successful. Save your credentials!",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
