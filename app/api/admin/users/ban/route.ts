import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { userId, reason } = body;

    if (!userId || !reason) {
      return NextResponse.json(
        { error: "User ID and reason are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.catch.updateMany({
      where: { userId },
      data: { isPublic: false },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.firstName || user.username || userId} has been banned`,
    });
  } catch (error) {
    console.error("Error banning user:", error);
    return NextResponse.json(
      { error: "Failed to ban user" },
      { status: 500 }
    );
  }
}

