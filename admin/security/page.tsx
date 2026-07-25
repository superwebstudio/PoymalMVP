import prisma from '@/lib/prisma';
import { SecurityClient } from './SecurityClient';

export const dynamic = 'force-dynamic';

async function getSecurityData() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get metrics
  const [
    authFailures24h,
    rateLimits24h,
    validationErrors24h,
    openAlerts,
    criticalAlerts,
    recentLogs,
    recentAlerts,
    authFailuresByHour,
    topOffenders,
  ] = await Promise.all([
    prisma.auditLog.count({ where: { eventType: 'auth_failure', createdAt: { gte: last24h } } }),
    prisma.auditLog.count({ where: { eventType: 'rate_limit', createdAt: { gte: last24h } } }),
    prisma.auditLog.count({ where: { eventType: 'validation_error', createdAt: { gte: last24h } } }),
    prisma.securityAlert.count({ where: { status: 'open' } }),
    prisma.securityAlert.count({ where: { status: 'open', severity: 'critical' } }),
    prisma.auditLog.findMany({
      where: { severity: { in: ['warning', 'error', 'critical'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.securityAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    // Auth failures by hour (last 24h)
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', "createdAt") as hour,
        COUNT(*) as count
      FROM "AuditLog"
      WHERE "eventType" = 'auth_failure'
        AND "createdAt" >= ${last24h}
      GROUP BY DATE_TRUNC('hour', "createdAt")
      ORDER BY hour DESC
    ` as Promise<{ hour: Date; count: bigint }[]>,
    // Top offending IPs/users
    prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        eventType: { in: ['auth_failure', 'rate_limit'] },
        createdAt: { gte: last24h },
        ipAddress: { not: null },
      },
      _count: true,
      orderBy: { _count: { ipAddress: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    metrics: {
      authFailures24h,
      rateLimits24h,
      validationErrors24h,
      openAlerts,
      criticalAlerts,
    },
    recentLogs: recentLogs.map(log => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
    recentAlerts: recentAlerts.map(alert => ({
      ...alert,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() || null,
    })),
    authFailuresByHour: authFailuresByHour.map(h => ({
      hour: h.hour.toISOString(),
      count: Number(h.count),
    })),
    topOffenders: topOffenders.map(o => ({
      ipAddress: o.ipAddress,
      count: o._count,
    })),
  };
}

export default async function SecurityPage() {
  const data = await getSecurityData();
  return <SecurityClient data={data} />;
}


