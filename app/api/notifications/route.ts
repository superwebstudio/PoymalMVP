import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const actorIds = [
      ...new Set(
        notifications.map((n) => n.actorId).filter((id): id is string => Boolean(id))
      ),
    ];

    const actors =
      actorIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: {
              id: true,
              firstName: true,
              username: true,
              photoUrl: true,
            },
          })
        : [];

    const actorMap = new Map(actors.map((a) => [a.id, a]));

    const enriched = notifications.map((n) => ({
      ...n,
      actor: n.actorId ? actorMap.get(n.actorId) ?? null : null,
    }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications: enriched, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const notificationId =
      typeof body.notificationId === 'string' ? body.notificationId : null;

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: auth.userId },
        data: { isRead: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: auth.userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Patch notifications error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
