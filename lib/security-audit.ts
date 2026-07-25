import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { NextRequest } from 'next/server';

/**
 * Security Audit Logging Service
 * Stores security events in the database for monitoring and alerting
 */

export type EventType =
  | 'auth_success'
  | 'auth_failure'
  | 'auth_expired'
  | 'rate_limit'
  | 'validation_error'
  | 'permission_denied'
  | 'suspicious_activity'
  | 'admin_action'
  | 'data_access'
  | 'data_modification'
  | 'file_upload'
  | 'api_error';

/** Audit log severity — matches AuditLog.severity in Prisma */
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

/** Security alert severity — matches SecurityAlert.severity in Prisma */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/** @deprecated Use AuditSeverity or AlertSeverity */
export type Severity = AuditSeverity | AlertSeverity;

export type AlertType =
  | 'brute_force'
  | 'rate_abuse'
  | 'suspicious_pattern'
  | 'unauthorized_access'
  | 'data_exfiltration';

interface AuditLogEntry {
  eventType: EventType;
  severity?: AuditSeverity;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  message: string;
  metadata?: Record<string, unknown> | null;
}

interface SecurityAlertEntry {
  alertType: AlertType;
  severity: AlertSeverity;
  userId?: string | null;
  ipAddress?: string | null;
  title: string;
  description: string;
  metadata?: Record<string, unknown> | null;
}

function toPrismaJson(
  metadata: Record<string, unknown> | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (metadata === null) {
    return Prisma.JsonNull;
  }

  return metadata as Prisma.InputJsonValue;
}

/**
 * Extract client information from request
 */
export function getClientInfo(request: NextRequest): { ip: string | null; userAgent: string | null } {
  // Try various headers for IP (behind proxies)
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    null;
  
  const userAgent = request.headers.get('user-agent');
  
  return { ip, userAgent };
}

/**
 * Sanitize metadata to remove sensitive information
 */
function sanitizeMetadata(metadata: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!metadata) return null;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'initData', 'apiKey'];
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.substring(0, 500) + '...[truncated]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: entry.eventType,
        severity: entry.severity || 'info',
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent?.substring(0, 500), // Truncate long user agents
        method: entry.method,
        path: entry.path?.substring(0, 500),
        statusCode: entry.statusCode,
        durationMs: entry.durationMs,
        message: entry.message.substring(0, 2000),
        metadata: toPrismaJson(sanitizeMetadata(entry.metadata)),
      },
    });
  } catch (error) {
    // Don't let audit logging failures break the app
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Log an audit event from a request context
 */
export async function logRequestAudit(
  request: NextRequest,
  entry: Omit<AuditLogEntry, 'method' | 'path' | 'ipAddress' | 'userAgent'>
): Promise<void> {
  const { ip, userAgent } = getClientInfo(request);
  const url = new URL(request.url);
  
  await logAuditEvent({
    ...entry,
    method: request.method,
    path: url.pathname,
    ipAddress: ip,
    userAgent: userAgent,
  });
}

/**
 * Create a security alert
 */
export async function createSecurityAlert(entry: SecurityAlertEntry): Promise<void> {
  try {
    await prisma.securityAlert.create({
      data: {
        alertType: entry.alertType,
        severity: entry.severity,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        title: entry.title.substring(0, 500),
        description: entry.description.substring(0, 2000),
        metadata: toPrismaJson(sanitizeMetadata(entry.metadata)),
        status: 'open',
      },
    });
    
    // Log to console for immediate visibility
    console.warn(`🚨 SECURITY ALERT [${entry.severity.toUpperCase()}]: ${entry.title}`);
    
    // In production, could trigger webhooks, emails, etc.
    if (entry.severity === 'critical') {
      // TODO: Send immediate notification (Telegram bot message, email, etc.)
      console.error('CRITICAL SECURITY ALERT - IMMEDIATE ACTION REQUIRED');
    }
  } catch (error) {
    console.error('Failed to create security alert:', error);
  }
}

/**
 * Track failed authentication attempts and create alert if threshold exceeded
 */
const authFailureCache = new Map<string, { count: number; firstAt: number }>();
const AUTH_FAILURE_THRESHOLD = 10;
const AUTH_FAILURE_WINDOW = 5 * 60 * 1000; // 5 minutes

export async function trackAuthFailure(
  request: NextRequest,
  userId?: string | null,
  reason?: string
): Promise<void> {
  const { ip } = getClientInfo(request);
  const key = ip || 'unknown';
  
  // Track in memory
  const now = Date.now();
  const existing = authFailureCache.get(key);
  
  if (existing && now - existing.firstAt < AUTH_FAILURE_WINDOW) {
    existing.count++;
    
    // Create alert if threshold exceeded
    if (existing.count === AUTH_FAILURE_THRESHOLD) {
      await createSecurityAlert({
        alertType: 'brute_force',
        severity: 'high',
        userId,
        ipAddress: ip,
        title: `Possible brute force attack from ${ip}`,
        description: `${AUTH_FAILURE_THRESHOLD} failed auth attempts in ${AUTH_FAILURE_WINDOW / 60000} minutes`,
        metadata: { reason, count: existing.count },
      });
    }
  } else {
    authFailureCache.set(key, { count: 1, firstAt: now });
  }
  
  // Log the individual failure
  await logRequestAudit(request, {
    eventType: 'auth_failure',
    severity: 'warning',
    userId,
    message: reason || 'Authentication failed',
  });
}

/**
 * Track rate limit hits and create alert if excessive
 */
const rateLimitCache = new Map<string, { count: number; firstAt: number }>();
const RATE_LIMIT_ALERT_THRESHOLD = 50; // 50 rate limits in 5 minutes = likely abuse

export async function trackRateLimitHit(
  request: NextRequest,
  userId: string,
  endpoint: string
): Promise<void> {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const existing = rateLimitCache.get(key);
  
  if (existing && now - existing.firstAt < AUTH_FAILURE_WINDOW) {
    existing.count++;
    
    if (existing.count === RATE_LIMIT_ALERT_THRESHOLD) {
      const { ip } = getClientInfo(request);
      await createSecurityAlert({
        alertType: 'rate_abuse',
        severity: 'medium',
        userId,
        ipAddress: ip,
        title: `Rate limit abuse detected for user ${userId.slice(0, 8)}...`,
        description: `${RATE_LIMIT_ALERT_THRESHOLD} rate limits hit on ${endpoint} in 5 minutes`,
        metadata: { endpoint, count: existing.count },
      });
    }
  } else {
    rateLimitCache.set(key, { count: 1, firstAt: now });
  }
  
  await logRequestAudit(request, {
    eventType: 'rate_limit',
    severity: 'warning',
    userId,
    message: `Rate limit exceeded on ${endpoint}`,
    statusCode: 429,
  });
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(options: {
  limit?: number;
  eventType?: EventType;
  severity?: AuditSeverity;
  userId?: string;
  since?: Date;
} = {}): Promise<unknown[]> {
  const { limit = 100, eventType, severity, userId, since } = options;
  
  return prisma.auditLog.findMany({
    where: {
      ...(eventType && { eventType }),
      ...(severity && { severity }),
      ...(userId && { userId }),
      ...(since && { createdAt: { gte: since } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get open security alerts (for admin dashboard)
 */
export async function getOpenSecurityAlerts(): Promise<unknown[]> {
  return prisma.securityAlert.findMany({
    where: { status: 'open' },
    orderBy: [
      { severity: 'desc' }, // Critical first
      { createdAt: 'desc' },
    ],
    take: 100,
  });
}

/**
 * Get security metrics for dashboard
 */
export async function getSecurityMetrics(since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): Promise<{
  authFailures: number;
  rateLimits: number;
  validationErrors: number;
  suspiciousActivity: number;
  openAlerts: number;
  criticalAlerts: number;
}> {
  const [authFailures, rateLimits, validationErrors, suspiciousActivity, openAlerts, criticalAlerts] = await Promise.all([
    prisma.auditLog.count({ where: { eventType: 'auth_failure', createdAt: { gte: since } } }),
    prisma.auditLog.count({ where: { eventType: 'rate_limit', createdAt: { gte: since } } }),
    prisma.auditLog.count({ where: { eventType: 'validation_error', createdAt: { gte: since } } }),
    prisma.auditLog.count({ where: { eventType: 'suspicious_activity', createdAt: { gte: since } } }),
    prisma.securityAlert.count({ where: { status: 'open' } }),
    prisma.securityAlert.count({ where: { status: 'open', severity: 'critical' } }),
  ]);
  
  return { authFailures, rateLimits, validationErrors, suspiciousActivity, openAlerts, criticalAlerts };
}

/**
 * Resolve a security alert
 */
export async function resolveSecurityAlert(
  alertId: string,
  adminUserId: string,
  resolution: string,
  status: 'resolved' | 'false_positive' = 'resolved'
): Promise<void> {
  await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      status,
      resolvedAt: new Date(),
      resolvedBy: adminUserId,
      resolution,
    },
  });
  
  // Log the admin action
  await logAuditEvent({
    eventType: 'admin_action',
    severity: 'info',
    userId: adminUserId,
    message: `Security alert ${alertId} marked as ${status}`,
    metadata: { alertId, resolution },
  });
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of authFailureCache.entries()) {
    if (now - entry.firstAt > AUTH_FAILURE_WINDOW * 2) {
      authFailureCache.delete(key);
    }
  }
  for (const [key, entry] of rateLimitCache.entries()) {
    if (now - entry.firstAt > AUTH_FAILURE_WINDOW * 2) {
      rateLimitCache.delete(key);
    }
  }
}, 60000);


