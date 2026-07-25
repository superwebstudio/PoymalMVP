import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: catchId } = await params;

    if (!catchId) {
      return NextResponse.json(
        { error: "Catch ID is required" },
        { status: 400 }
      );
    }

    // Check if catch exists
    const catchItem = await prisma.catch.findUnique({
      where: { id: catchId },
    });

    if (!catchItem) {
      return NextResponse.json(
        { error: "Catch not found" },
        { status: 404 }
      );
    }

    // Delete catch (cascades to likes, comments, reactions)
    await prisma.catch.delete({
      where: { id: catchId },
    });

    return NextResponse.json({
      success: true,
      message: "Catch has been deleted",
    });
  } catch (error) {
    console.error("Error deleting catch:", error);
    return NextResponse.json(
      { error: "Failed to delete catch" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: catchId } = await params;
    const body = await request.json();
    const { isPublic } = body;

    if (!catchId) {
      return NextResponse.json(
        { error: "Catch ID is required" },
        { status: 400 }
      );
    }

    // Update catch visibility
    const updatedCatch = await prisma.catch.update({
      where: { id: catchId },
      data: { isPublic },
    });

    return NextResponse.json({
      success: true,
      catch: updatedCatch,
    });
  } catch (error) {
    console.error("Error updating catch:", error);
    return NextResponse.json(
      { error: "Failed to update catch" },
      { status: 500 }
    );
  }
}

