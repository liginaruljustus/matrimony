import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, ProfileModel, AuditLogModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25")));
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.profileType = type;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { profileId: { $regex: escaped, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      UserModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      UserModel.countDocuments(filter),
    ]);

    // Fetch profile data for each user
    const userIds = users.map((u) => u._id);
    const profiles = await ProfileModel.find({ userId: { $in: userIds } });
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const usersWithProfiles = users.map((user) => {
      const profile = profileMap.get(user._id.toString());
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profileId: user.profileId,
        profileType: user.profileType,
        status: user.status,
        verificationStatus: user.verificationStatus,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        profile: profile
          ? {
              id: profile._id.toString(),
              name: profile.name,
              profileStatus: profile.profileStatus,
            }
          : null,
      };
    });

    return NextResponse.json({
      users: usersWithProfiles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { action, userIds, reason } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Invalid userIds" }, { status: 400 });
    }

    const objectIds = userIds.map((id) => require("mongodb").ObjectId(id));
    let updateData: any = {};

    switch (action) {
      case "suspend":
        updateData = {
          status: "SUSPENDED",
          suspendedAt: new Date(),
          suspendReason: reason || "Admin suspension",
        };
        break;
      case "ban":
        updateData = {
          status: "BANNED",
          suspendedAt: new Date(),
          suspendReason: reason || "Admin ban",
        };
        break;
      case "activate":
        updateData = {
          status: "ACTIVE",
          suspendedAt: null,
          suspendReason: null,
        };
        break;
      case "delete":
        // Soft delete - mark as inactive
        updateData = {
          status: "INACTIVE",
        };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await UserModel.updateMany({ _id: { $in: objectIds } }, { $set: updateData });

    // Log audit actions
    for (const userId of userIds) {
      await AuditLogModel.create({
        adminId: session.user.id,
        action: `bulk_${action}`,
        targetType: "User",
        targetId: require("mongodb").ObjectId(userId),
        changes: {
          before: { status: "ACTIVE" },
          after: updateData,
        },
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating users:", error);
    return NextResponse.json({ error: "Failed to update users" }, { status: 500 });
  }
}
