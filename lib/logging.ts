/**
 * Request logging utility for security monitoring
 */

interface RequestLogEntry {
  timestamp: string;
  method: string;
  path: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  durationMs?: number;
  error?: string;
}

// In-memory log buffer (for development)
// In production, use proper logging service (DataDog, Sentry, etc.)
const LOG_BUFFER_SIZE = 1000;
const requestLogs: RequestLogEntry[] = [];

/**
 * Log a request
 */
export function logRequest(entry: RequestLogEntry): void {
  // Add to buffer (circular)
  if (requestLogs.length >= LOG_BUFFER_SIZE) {
    requestLogs.shift();
  }
  requestLogs.push(entry);
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = entry.statusCode && entry.statusCode >= 400 ? '❌' : '✅';
    console.log(
      `${emoji} [${entry.timestamp}] ${entry.method} ${entry.path}`,
      entry.userId ? `user=${entry.userId.slice(0, 8)}...` : '',
      entry.statusCode ? `status=${entry.statusCode}` : '',
      entry.durationMs ? `${entry.durationMs}ms` : '',
      entry.error ? `error=${entry.error}` : ''
    );
  }
}

/**
 * Log a security-relevant event
 */
export function logSecurityEvent(
  eventType: 'auth_failure' | 'rate_limit' | 'validation_failure' | 'suspicious_activity',
  details: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    eventType,
    ...details,
  };
  
  // In production, send to security monitoring service
  console.warn(`🔒 Security Event [${eventType}]:`, JSON.stringify(entry));
  
  // Could send to Sentry, DataDog, or custom alerting system
  // sendToSecurityMonitoring(entry);
}

/**
 * Get recent logs (for admin dashboard)
 */
export function getRecentLogs(count: number = 100): RequestLogEntry[] {
  return requestLogs.slice(-count);
}

/**
 * Get logs by userId (for debugging)
 */
export function getLogsByUser(userId: string, count: number = 50): RequestLogEntry[] {
  return requestLogs
    .filter(log => log.userId === userId)
    .slice(-count);
}

/**
 * Get error logs
 */
export function getErrorLogs(count: number = 100): RequestLogEntry[] {
  return requestLogs
    .filter(log => log.statusCode && log.statusCode >= 400)
    .slice(-count);
}

/**
 * Clear logs (for testing)
 */
export function clearLogs(): void {
  requestLogs.length = 0;
}

/**
 * Create a request timer
 */
export function createRequestTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(
  data: T,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'authorization', 'cookie']
): T {
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      (sanitized as Record<string, unknown>)[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

