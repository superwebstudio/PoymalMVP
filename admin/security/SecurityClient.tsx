"use client";

import {
  Shield,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Ban,
  CheckCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface SecurityData {
  metrics: {
    authFailures24h: number;
    rateLimits24h: number;
    validationErrors24h: number;
    openAlerts: number;
    criticalAlerts: number;
  };
  recentLogs: Array<{
    id: string;
    eventType: string;
    severity: string;
    userId: string | null;
    ipAddress: string | null;
    method: string | null;
    path: string | null;
    statusCode: number | null;
    message: string;
    createdAt: string;
  }>;
  recentAlerts: Array<{
    id: string;
    alertType: string;
    severity: string;
    userId: string | null;
    ipAddress: string | null;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    resolvedAt: string | null;
  }>;
  authFailuresByHour: Array<{ hour: string; count: number }>;
  topOffenders: Array<{ ipAddress: string | null; count: number }>;
}

interface SecurityClientProps {
  data: SecurityData;
}

export function SecurityClient({ data }: SecurityClientProps) {
  const { metrics, recentLogs, recentAlerts, topOffenders } = data;
  const [selectedTab, setSelectedTab] = useState<'logs' | 'alerts'>('alerts');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'var(--admin-danger)';
      case 'error': return '#ef4444';
      case 'warning': return 'var(--admin-warning)';
      case 'high': return '#ef4444';
      case 'medium': return 'var(--admin-warning)';
      case 'low': return 'var(--admin-accent)';
      default: return 'var(--admin-text-secondary)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--admin-danger)';
      case 'investigating': return 'var(--admin-warning)';
      case 'resolved': return 'var(--admin-success)';
      case 'false_positive': return 'var(--admin-text-secondary)';
      default: return 'var(--admin-text-secondary)';
    }
  };

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={28} style={{ color: 'var(--admin-accent)' }} />
          <div>
            <h1 className="admin-page-title">Security Monitoring</h1>
            <p className="admin-page-subtitle">
              Real-time security events and alerts
            </p>
          </div>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={() => window.location.reload()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Alert Banner if Critical Alerts */}
      {metrics.criticalAlerts > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          <div>
            <strong style={{ color: '#ef4444' }}>
              {metrics.criticalAlerts} Critical Alert{metrics.criticalAlerts > 1 ? 's' : ''} Require Immediate Attention
            </strong>
            <p style={{ color: 'var(--admin-text-secondary)', marginTop: '4px', fontSize: '14px' }}>
              Review and resolve critical security alerts below
            </p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card" style={{ '--stat-bg': 'rgba(239, 68, 68, 0.15)', '--stat-color': '#ef4444' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Auth Failures (24h)</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{metrics.authFailures24h}</div>
          <span className="admin-stat-change neutral">Failed login attempts</span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-bg': 'rgba(245, 158, 11, 0.15)', '--stat-color': 'var(--admin-warning)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Rate Limits (24h)</span>
            <div className="admin-stat-icon">
              <Ban size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{metrics.rateLimits24h}</div>
          <span className="admin-stat-change neutral">429 responses</span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-bg': 'rgba(14, 165, 233, 0.15)', '--stat-color': 'var(--admin-accent)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Validation Errors</span>
            <div className="admin-stat-icon">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{metrics.validationErrors24h}</div>
          <span className="admin-stat-change neutral">Bad requests</span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-bg': metrics.openAlerts > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', '--stat-color': metrics.openAlerts > 0 ? '#ef4444' : 'var(--admin-success)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Open Alerts</span>
            <div className="admin-stat-icon">
              <Activity size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{metrics.openAlerts}</div>
          <span className="admin-stat-change neutral">
            {metrics.criticalAlerts} critical
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="admin-grid admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* Top Offenders */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Top Offending IPs (24h)</h3>
          </div>
          <div className="admin-card-body">
            {topOffenders.length === 0 ? (
              <p style={{ color: 'var(--admin-text-secondary)', textAlign: 'center', padding: '20px' }}>
                No suspicious activity detected
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topOffenders.map((offender, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--admin-bg-secondary)',
                    borderRadius: '8px',
                  }}>
                    <code style={{ fontFamily: 'monospace', color: 'var(--admin-text)' }}>
                      {offender.ipAddress || 'Unknown'}
                    </code>
                    <span style={{
                      color: offender.count > 20 ? '#ef4444' : offender.count > 10 ? 'var(--admin-warning)' : 'var(--admin-text-secondary)',
                      fontWeight: '600',
                    }}>
                      {offender.count} events
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Security Status</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {metrics.criticalAlerts === 0 ? (
                  <CheckCircle size={24} style={{ color: 'var(--admin-success)' }} />
                ) : (
                  <XCircle size={24} style={{ color: '#ef4444' }} />
                )}
                <span style={{ color: 'var(--admin-text)' }}>
                  {metrics.criticalAlerts === 0 ? 'No critical alerts' : `${metrics.criticalAlerts} critical alert(s)`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {metrics.authFailures24h < 100 ? (
                  <CheckCircle size={24} style={{ color: 'var(--admin-success)' }} />
                ) : (
                  <AlertTriangle size={24} style={{ color: 'var(--admin-warning)' }} />
                )}
                <span style={{ color: 'var(--admin-text)' }}>
                  Auth failure rate: {metrics.authFailures24h < 100 ? 'Normal' : 'Elevated'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {metrics.rateLimits24h < 500 ? (
                  <CheckCircle size={24} style={{ color: 'var(--admin-success)' }} />
                ) : (
                  <AlertTriangle size={24} style={{ color: 'var(--admin-warning)' }} />
                )}
                <span style={{ color: 'var(--admin-text)' }}>
                  Rate limiting: {metrics.rateLimits24h < 500 ? 'Normal' : 'High activity'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`admin-btn ${selectedTab === 'alerts' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setSelectedTab('alerts')}
        >
          Security Alerts ({recentAlerts.filter(a => a.status === 'open').length})
        </button>
        <button
          className={`admin-btn ${selectedTab === 'logs' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setSelectedTab('logs')}
        >
          Audit Logs
        </button>
      </div>

      {/* Alerts Table */}
      {selectedTab === 'alerts' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Security Alerts</h3>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>IP/User</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-secondary)' }}>
                      No security alerts
                    </td>
                  </tr>
                ) : (
                  recentAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <span className="admin-badge" style={{
                          background: `${getSeverityColor(alert.severity)}20`,
                          color: getSeverityColor(alert.severity),
                          textTransform: 'uppercase',
                          fontSize: '11px',
                        }}>
                          {alert.severity}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {alert.alertType}
                      </td>
                      <td>{alert.title}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {alert.ipAddress || alert.userId?.slice(0, 8) || '-'}
                      </td>
                      <td>
                        <span className="admin-badge" style={{
                          background: `${getStatusColor(alert.status)}20`,
                          color: getStatusColor(alert.status),
                        }}>
                          {alert.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--admin-text-secondary)', fontSize: '13px' }}>
                        {formatRelativeTime(new Date(alert.createdAt))}
                      </td>
                      <td>
                        <button className="admin-btn admin-btn-ghost admin-btn-sm">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {selectedTab === 'logs' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent Audit Logs</h3>
            <span style={{ color: 'var(--admin-text-secondary)', fontSize: '13px' }}>
              Showing warnings and errors
            </span>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Event</th>
                  <th>Message</th>
                  <th>Path</th>
                  <th>IP</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="admin-badge" style={{
                        background: `${getSeverityColor(log.severity)}20`,
                        color: getSeverityColor(log.severity),
                        textTransform: 'uppercase',
                        fontSize: '11px',
                      }}>
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {log.eventType}
                    </td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.message}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                      {log.method} {log.path?.slice(0, 30)}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {log.ipAddress || '-'}
                    </td>
                    <td style={{ color: 'var(--admin-text-secondary)', fontSize: '13px' }}>
                      {formatRelativeTime(new Date(log.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}


