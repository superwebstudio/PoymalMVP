"use client";

import {
  Users,
  TrendingUp,
  Fish,
  DollarSign,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Crown,
} from "lucide-react";
import type { DashboardMetrics, UserSegments, FunnelStep } from "@/admin/types";

interface DashboardClientProps {
  data: {
    metrics: DashboardMetrics;
    segments: UserSegments;
    funnel: FunnelStep[];
    recentUsers: any[];
    recentCatches: any[];
  };
}

export function DashboardClient({ data }: DashboardClientProps) {
  const { metrics, segments, funnel, recentUsers, recentCatches } = data;

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">
          Overview of your fishing app&apos;s performance
        </p>
      </div>

      {/* Core Stats Grid */}
      <div className="admin-stats-grid">
        {/* Total Users */}
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-1)', '--stat-bg': 'rgba(14, 165, 233, 0.15)', '--stat-color': 'var(--admin-accent)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Users</span>
            <div className="admin-stat-icon">
              <Users size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{metrics.totalUsers.toLocaleString()}</div>
          <span className="admin-stat-change positive">
            <ArrowUpRight size={14} />
            +{metrics.newSignupsThisWeek} this week
          </span>
        </div>

        {/* DAU */}
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-2)', '--stat-bg': 'rgba(34, 197, 94, 0.15)', '--stat-color': 'var(--admin-success)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Daily Active</span>
            <div className="admin-stat-icon">
              <Activity size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{metrics.dailyActiveUsers.toLocaleString()}</div>
          <span className="admin-stat-change neutral">
            {metrics.totalUsers > 0 ? Math.round((metrics.dailyActiveUsers / metrics.totalUsers) * 100) : 0}% of total
          </span>
        </div>

        {/* Total Catches */}
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-4)', '--stat-bg': 'rgba(139, 92, 246, 0.15)', '--stat-color': '#a855f7' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Catches</span>
            <div className="admin-stat-icon">
              <Fish size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{metrics.totalCatches.toLocaleString()}</div>
          <span className="admin-stat-change positive">
            <ArrowUpRight size={14} />
            +{metrics.catchesThisWeek} this week
          </span>
        </div>

        {/* MRR */}
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-3)', '--stat-bg': 'rgba(245, 158, 11, 0.15)', '--stat-color': 'var(--admin-warning)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">MRR</span>
            <div className="admin-stat-icon">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="admin-stat-value">€{metrics.monthlyRecurringRevenue.toLocaleString()}</div>
          <span className="admin-stat-change positive">
            {metrics.premiumUsers} premium users
          </span>
        </div>

        {/* Conversion Rate */}
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-1)', '--stat-bg': 'rgba(14, 165, 233, 0.15)', '--stat-color': 'var(--admin-accent)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Conversion Rate</span>
            <div className="admin-stat-icon">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{metrics.conversionRate}%</div>
          <span className="admin-stat-change neutral">
            Free → Premium
          </span>
        </div>

        {/* Referrals */}
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-2)', '--stat-bg': 'rgba(34, 197, 94, 0.15)', '--stat-color': 'var(--admin-success)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Completed Referrals</span>
            <div className="admin-stat-icon">
              <Share2 size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{metrics.completedReferrals}</div>
          <span className="admin-stat-change neutral">
            {metrics.referralConversionRate}% completion rate
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="admin-grid admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* User Funnel */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">User Lifecycle Funnel</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-funnel">
              {funnel.map((step, index) => (
                <div key={step.label} className="admin-funnel-step">
                  <div className="admin-funnel-number">{index + 1}</div>
                  <div className="admin-funnel-content">
                    <div className="admin-funnel-label">{step.label}</div>
                    <div className="admin-funnel-value">{step.count.toLocaleString()} users</div>
                  </div>
                  <div className="admin-funnel-percent" style={{ color: getPercentageColor(step.percentage) }}>
                    {step.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Segments */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">User Segments</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SegmentRow 
                label="Power Users (3+/week)" 
                count={segments.powerUsers} 
                total={metrics.totalUsers}
                color="var(--admin-success)"
              />
              <SegmentRow 
                label="Regular Users (1+/week)" 
                count={segments.regularUsers} 
                total={metrics.totalUsers}
                color="var(--admin-accent)"
              />
              <SegmentRow 
                label="Casual Users (1-2/month)" 
                count={segments.casualUsers} 
                total={metrics.totalUsers}
                color="var(--admin-warning)"
              />
              <SegmentRow 
                label="Dead Users (30+ days)" 
                count={segments.deadUsers} 
                total={metrics.totalUsers}
                color="var(--admin-danger)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Engagement & Revenue Details */}
      <div className="admin-grid admin-grid-3" style={{ marginBottom: '24px' }}>
        {/* Engagement Metrics */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Engagement</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-metric-row">
              <span className="admin-metric-label">Avg catches/user</span>
              <span className="admin-metric-value">{metrics.avgCatchesPerUser}</span>
            </div>
            <div className="admin-metric-row">
              <span className="admin-metric-label">Users with 1+ catch</span>
              <span className="admin-metric-value">{metrics.usersWithAtLeastOneCatch}</span>
            </div>
            <div className="admin-metric-row">
              <span className="admin-metric-label">Activation rate (3+)</span>
              <span className="admin-metric-value">{metrics.activationRate}%</span>
            </div>
            <div className="admin-metric-row">
              <span className="admin-metric-label">Catches today</span>
              <span className="admin-metric-value">{metrics.catchesToday}</span>
            </div>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Revenue</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-metric-row">
              <span className="admin-metric-label">Premium users</span>
              <span className="admin-metric-value">{metrics.premiumUsers}</span>
            </div>
            <div className="admin-metric-row">
              <span className="admin-metric-label">Free users</span>
              <span className="admin-metric-value">{metrics.freeUsers}</span>
            </div>
            <div className="admin-metric-row">
              <span className="admin-metric-label">ARPU</span>
              <span className="admin-metric-value">€{metrics.averageRevenuePerUser}</span>
            </div>
            <div className="admin-metric-row">
              <span className="admin-metric-label">Conversion rate</span>
              <span className="admin-metric-value">{metrics.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Retention Metrics */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Retention</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-metric-row">
              <span className="admin-metric-label">Day 1 retention</span>
              <span className="admin-metric-value" style={{ color: metrics.retention.day1 >= 50 ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
                {metrics.retention.day1}%
              </span>
            </div>
            <div className="admin-metric-row">
              <span className="admin-metric-label">Day 7 retention</span>
              <span className="admin-metric-value" style={{ color: metrics.retention.day7 >= 30 ? 'var(--admin-success)' : 'var(--admin-warning)' }}>
                {metrics.retention.day7}%
              </span>
            </div>
            <div className="admin-metric-row">
              <span className="admin-metric-label">Day 30 retention</span>
              <span className="admin-metric-value" style={{ color: metrics.retention.day30 >= 15 ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
                {metrics.retention.day30}%
              </span>
            </div>
            <div className="admin-metric-row">
              <span className="admin-metric-label">Referral completion</span>
              <span className="admin-metric-value">{metrics.referralConversionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-grid admin-grid-2">
        {/* Recent Users */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent Signups</h3>
            <a href="/admin/users" className="admin-btn admin-btn-secondary admin-btn-sm">
              View All
            </a>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Catches</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt="" />
                          ) : (
                            user.firstName?.[0] || '?'
                          )}
                        </div>
                        <div className="admin-user-info">
                          <span className="admin-user-name">{user.firstName || 'Unknown'}</span>
                          <span className="admin-user-username">@{user.username || 'no-username'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.totalCatches}</td>
                    <td>
                      {user.isPro ? (
                        <span className="admin-badge pro">
                          <Crown size={12} />
                          Pro
                        </span>
                      ) : (
                        <span className="admin-badge free">Free</span>
                      )}
                    </td>
                    <td>{formatRelativeTime(new Date(user.createdAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Catches */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent Catches</h3>
            <a href="/admin/catches" className="admin-btn admin-btn-secondary admin-btn-sm">
              View All
            </a>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Species</th>
                  <th>Engagement</th>
                  <th>Posted</th>
                </tr>
              </thead>
              <tbody>
                {recentCatches.map((catchItem) => (
                  <tr key={catchItem.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {catchItem.user.photoUrl ? (
                            <img src={catchItem.user.photoUrl} alt="" />
                          ) : (
                            catchItem.user.firstName?.[0] || '?'
                          )}
                        </div>
                        <div className="admin-user-info">
                          <span className="admin-user-name">{catchItem.user.firstName || 'Unknown'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{catchItem.species || 'Unknown'}</td>
                    <td>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>
                        ❤️ {catchItem.likesCount} · 💬 {catchItem.commentsCount}
                      </span>
                    </td>
                    <td>{formatRelativeTime(new Date(catchItem.createdAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="admin-metric-label">{label}</span>
        <span className="admin-metric-value">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="admin-progress">
        <div 
          className="admin-progress-bar" 
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
    </div>
  );
}

function getPercentageColor(percentage: number): string {
  if (percentage >= 50) return 'var(--admin-success)';
  if (percentage >= 20) return 'var(--admin-warning)';
  return 'var(--admin-danger)';
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

