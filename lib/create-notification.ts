import prisma from '@/lib/prisma';

type CatchNotificationType = 'like' | 'comment';

export async function createCatchNotification(params: {
  recipientId: string;
  actorId: string;
  catchId: string;
  type: CatchNotificationType;
  commentPreview?: string;
}): Promise<void> {
  const { recipientId, actorId, catchId, type, commentPreview } = params;

  if (recipientId === actorId) return;

  const [recipient, actor, catchRow] = await Promise.all([
    prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        notificationsEnabled: true,
        notifyOnLikes: true,
        notifyOnComments: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: actorId },
      select: { firstName: true, username: true },
    }),
    prisma.catch.findUnique({
      where: { id: catchId },
      select: { species: true },
    }),
  ]);

  if (!recipient?.notificationsEnabled || !actor) return;
  if (type === 'like' && !recipient.notifyOnLikes) return;
  if (type === 'comment' && !recipient.notifyOnComments) return;

  const actorName = actor.firstName || actor.username || 'Someone';
  const species = catchRow?.species ? ` (${catchRow.species})` : '';

  const content =
    type === 'like'
      ? `${actorName} liked your catch${species}`
      : `${actorName} commented on your catch${species}${
          commentPreview ? `: "${commentPreview.slice(0, 80)}"` : ''
        }`;

  await prisma.notification.create({
    data: {
      userId: recipientId,
      type,
      actorId,
      catchId,
      content,
    },
  });
}
