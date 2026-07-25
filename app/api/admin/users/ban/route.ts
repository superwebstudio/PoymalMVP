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
    const { userId, reason, duration } = body;

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

    // For now, we'll delete the user's content visibility
    // In a production app, you'd have a banned_users table or a isBanned field
    
    // Hide all user's catches (make them private)
    await prisma.catch.updateMany({
      where: { userId },
      data: { isPublic: false },
    });

    // Log the ban action (you could create an AdminAction table for audit)
    console.log(`User ${userId} banned. Reason: ${reason}. Duration: ${duration || 'permanent'}`);

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

