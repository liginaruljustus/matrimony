import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, AuditLogModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    let query: any = { verificationStatus: status };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { profileId: { $regex: escaped, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .select("_id name email profileId verificationStatus verificationDocuments notes createdAt")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean<any[]>(),
      UserModel.countDocuments(query),
    ]);

    return NextResponse.json({
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profileId: user.profileId,
        verificationStatus: user.verificationStatus,
        documentCount: user.verificationDocuments?.length || 0,
        documents: user.verificationDocuments || [],
        notes: user.notes,
        createdAt: user.createdAt,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching verification queue:", error);
    return NextResponse.json({ error: "Failed to fetch verification queue" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { userId, status, rejectionReason, notes } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const before = {
      verificationStatus: user.verificationStatus,
      notes: user.notes,
    };

    // Update verification status
    user.verificationStatus = status;
    if (notes) {
      user.notes = notes;
    }

    // Store rejection reason if rejected
    if (status === "REJECTED" && rejectionReason) {
      if (!user.verificationDocuments) user.verificationDocuments = [];
      user.verificationDocuments.forEach((doc: any) => {
        doc.rejectionReason = rejectionReason;
      });
    }

    await user.save();

    // Log audit action
    await AuditLogModel.create({
      adminId: session.user.id,
      action: "update_verification",
      targetType: "User",
      targetId: user._id,
      changes: {
        before,
        after: { verificationStatus: status, notes },
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Error updating verification:", error);
    return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
  }
}

// Bulk actions
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { action, userIds, status, rejectionReason, notes } = await request.json();

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let result: any = {};

    if (action === "verify") {
      result = await UserModel.updateMany(
        { _id: { $in: userIds } },
        {
          $set: {
            verificationStatus: "VERIFIED",
            notes: notes || "",
          },
        }
      );
    } else if (action === "reject") {
      result = await UserModel.updateMany(
        { _id: { $in: userIds } },
        {
          $set: {
            verificationStatus: "REJECTED",
            notes: rejectionReason || notes || "",
          },
        }
      );
    }

    // Log audit action
    await AuditLogModel.create({
      adminId: session.user.id,
      action: `bulk_${action}_verification`,
      targetType: "User",
      targetId: null,
      changes: {
        count: userIds.length,
        action,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `${userIds.length} users ${action}ed successfully`,
      result,
    });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
