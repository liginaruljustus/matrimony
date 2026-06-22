import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ReportModel, UserModel, ProfileModel, AuditLogModel } from "@/lib/models";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "OPEN";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    let query: any = { status };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { reason: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const [reports, total] = await Promise.all([
      ReportModel.find(query)
        .populate("reporterId", "name email profileId")
        .populate("reportedUserId", "name email profileId status")
        .populate("reportedProfileId", "profileType profileStatus")
        .populate("resolvedBy", "name email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean<any[]>(),
      ReportModel.countDocuments(query),
    ]);

    return NextResponse.json({
      reports: reports.map((report) => ({
        id: report._id.toString(),
        reason: report.reason,
        description: report.description,
        status: report.status,
        priority: calculatePriority(report.reason),
        reporterId: report.reporterId?._id?.toString(),
        reporter: {
          name: report.reporterId?.name,
          email: report.reporterId?.email,
          profileId: report.reporterId?.profileId,
        },
        reportedUserId: report.reportedUserId?._id?.toString(),
        reportedUser: {
          id: report.reportedUserId?._id?.toString(),
          name: report.reportedUserId?.name,
          email: report.reportedUserId?.email,
          profileId: report.reportedUserId?.profileId,
          status: report.reportedUserId?.status,
        },
        reportedProfileId: report.reportedProfileId?._id?.toString(),
        reportedProfile: {
          profileType: report.reportedProfileId?.profileType,
          profileStatus: report.reportedProfileId?.profileStatus,
        },
        action: report.action,
        resolvedBy: report.resolvedBy?.name,
        resolvedAt: report.resolvedAt,
        createdAt: report.createdAt,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { reportId, status, action, notes } = await request.json();

    if (!reportId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const report = await ReportModel.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const before = {
      status: report.status,
      action: report.action,
    };

    // Update report status
    report.status = status;
    if (action) {
      report.action = action;
    }
    if (status === "RESOLVED" || status === "DISMISSED") {
      report.resolvedBy = session.user.id;
      report.resolvedAt = new Date();
    }

    // Take action on reported user if needed
    if (action && report.reportedUserId) {
      const user = await UserModel.findById(report.reportedUserId);
      if (user) {
        if (action === "SUSPEND") {
          user.status = "SUSPENDED";
          user.suspendedAt = new Date();
          user.suspendReason = `Suspended due to report: ${report.reason}`;
        } else if (action === "BAN") {
          user.status = "BANNED";
          user.suspendedAt = new Date();
          user.suspendReason = `Banned due to report: ${report.reason}`;
        }
        await user.save();
      }
    }

    await report.save();

    // Log audit action
    await AuditLogModel.create({
      adminId: session.user.id,
      action: "resolve_report",
      targetType: "Report",
      targetId: report._id,
      changes: {
        before,
        after: { status, action },
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report._id.toString(),
        status: report.status,
        action: report.action,
      },
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
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
    const { action, reportIds, status } = await request.json();

    if (!action || !reportIds || !Array.isArray(reportIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let result: any = {};

    if (action === "resolve") {
      result = await ReportModel.updateMany(
        { _id: { $in: reportIds } },
        {
          $set: {
            status: "RESOLVED",
            resolvedBy: session.user.id,
            resolvedAt: new Date(),
          },
        }
      );
    } else if (action === "dismiss") {
      result = await ReportModel.updateMany(
        { _id: { $in: reportIds } },
        {
          $set: {
            status: "DISMISSED",
            resolvedBy: session.user.id,
            resolvedAt: new Date(),
          },
        }
      );
    }

    // Log audit action
    await AuditLogModel.create({
      adminId: session.user.id,
      action: `bulk_${action}_reports`,
      targetType: "Report",
      targetId: null,
      changes: {
        count: reportIds.length,
        action,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `${reportIds.length} reports ${action}ed successfully`,
      result,
    });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}

function calculatePriority(reason: string): "high" | "medium" | "low" {
  const highPriority = [
    "harassment",
    "abuse",
    "threats",
    "violence",
    "illegal",
    "fraud",
    "scam",
    "blackmail",
  ];
  const mediumPriority = [
    "inappropriate",
    "offensive",
    "spam",
    "fake",
    "misleading",
    "suspicious",
  ];

  const lowerReason = reason.toLowerCase();
  if (highPriority.some((p) => lowerReason.includes(p))) return "high";
  if (mediumPriority.some((p) => lowerReason.includes(p))) return "medium";
  return "low";
}
