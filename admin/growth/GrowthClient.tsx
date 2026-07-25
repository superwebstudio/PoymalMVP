"use client";

import {
  TrendingUp,
  TrendingDown,
  Users,
  ArrowRight,
  Target,
  Globe,
} from "lucide-react";

interface GrowthData {
  signupsThisWeek: number;
  signupsLastWeek: number;
  weekOverWeekGrowth: number;
  totalUsers: number;
  cumulativeGrowth: { date: string; totalUsers: number; newUsers: number }[];
  retentionCohorts: { label: string; signedUp: number; returned: number; retentionRate: number }[];
  funnel: {
    totalUsers: number;
    usersWithCatches: number;
    activatedUsers: number;
    premiumUsers: number;
  };
  signupsBySource: { source: string; count: number }[];
}

export function GrowthClient({ data }: { data: GrowthData }) {
  const maxUsers = Math.max(...data.cumulativeGrowth.map(d => d.totalUsers), 1);
  
  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Growth Metrics</h1>
        <p className="admin-page-subtitle">
          Track user acquisition and retention performance
        </p>
      </div>

      {/* Key Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-1)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Users</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--admin-accent)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.totalUsers.toLocaleString()}</div>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-2)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">This Week</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--admin-success)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.signupsThisWeek}</div>
          <span className={`admin-stat-change ${data.weekOverWeekGrowth >= 0 ? 'positive' : 'negative'}`}>
            {data.weekOverWeekGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {data.weekOverWeekGrowth >= 0 ? '+' : ''}{data.weekOverWeekGrowth}% vs last week
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-3)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Activation Rate</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--admin-warning)' }}>
              <Target size={18} />
            </div>
          </div>
          <div className="admin-stat-value">
            {data.totalUsers > 0 ? Math.round((data.funnel.activatedUsers / data.totalUsers) * 100) : 0}%
          </div>
          <span className="admin-stat-change neutral">
            Users with 3+ catches
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-4)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Conversion Rate</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="admin-stat-value">
            {data.totalUsers > 0 ? Math.round((data.funnel.premiumUsers / data.totalUsers) * 100 * 10) / 10 : 0}%
          </div>
          <span className="admin-stat-change neutral">
            Free → Premium
          </span>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">User Growth (30 Days)</h3>
        </div>
        <div className="admin-card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '200px', marginBottom: '16px' }}>
            {data.cumulativeGrowth.map((d, i) => (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  height: `${(d.totalUsers / maxUsers) * 100}%`,
                  background: 'linear-gradient(to top, var(--admin-accent), rgba(14, 165, 233, 0.3))',
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                }}
                title={`${d.date}: ${d.totalUsers} total users (+${d.newUsers} new)`}
              >
                {d.newUsers > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${(d.newUsers / d.totalUsers) * 100}%`,
                      background: 'var(--admin-success)',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
            <span><span style={{ width: '12px', height: '12px', background: 'var(--admin-accent)', display: 'inline-block', borderRadius: '2px', marginRight: '6px' }} />Total Users</span>
            <span><span style={{ width: '12px', height: '12px', background: 'var(--admin-success)', display: 'inline-block', borderRadius: '2px', marginRight: '6px' }} />New Users</span>
          </div>
        </div>
      </div>

      <div className="admin-grid admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* User Lifecycle Funnel */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">User Lifecycle Funnel</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-funnel">
              <FunnelStep
                number={1}
                label="Signed Up"
                count={data.funnel.totalUsers}
                percentage={100}
              />
              <FunnelStep
                number={2}
                label="Posted First Catch"
                count={data.funnel.usersWithCatches}
                percentage={data.totalUsers > 0 ? (data.funnel.usersWithCatches / data.totalUsers) * 100 : 0}
              />
              <FunnelStep
                number={3}
                label="Activated (3+ catches)"
                count={data.funnel.activatedUsers}
                percentage={data.totalUsers > 0 ? (data.funnel.activatedUsers / data.totalUsers) * 100 : 0}
              />
              <FunnelStep
                number={4}
                label="Premium Subscriber"
                count={data.funnel.premiumUsers}
                percentage={data.totalUsers > 0 ? (data.funnel.premiumUsers / data.totalUsers) * 100 : 0}
                isLast
              />
            </div>
          </div>
        </div>

        {/* Retention Cohorts */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Retention Cohorts</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.retentionCohorts.map((cohort) => (
                <div key={cohort.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--admin-text)' }}>{cohort.label} Retention</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: getRetentionColor(cohort.retentionRate) }}>
                      {cohort.retentionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="admin-progress">
                    <div 
                      className="admin-progress-bar" 
                      style={{ 
                        width: `${cohort.retentionRate}%`,
                        background: getRetentionGradient(cohort.retentionRate),
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    <span>{cohort.returned} returned</span>
                    <span>of {cohort.signedUp} signed up</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '24px', padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
              <strong style={{ color: 'var(--admin-text)' }}>Benchmarks:</strong> Day 1 &gt;50%, Day 7 &gt;30%, Day 30 &gt;15%
            </div>
          </div>
        </div>
      </div>

      {/* Signups by Country */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Signups by Country (Last 30 Days)</h3>
        </div>
        <div className="admin-card-body">
          {data.signupsBySource.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {data.signupsBySource.map((source, i) => (
                <div key={source.source} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
                  <span style={{ fontSize: '32px' }}>{getCountryFlag(source.source)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--admin-text)' }}>{source.source}</div>
                    <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>{source.count} signups</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              No country data available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ number, label, count, percentage, isLast = false }: { number: number; label: string; count: number; percentage: number; isLast?: boolean }) {
  return (
    <div className="admin-funnel-step" style={{ background: `rgba(14, 165, 233, ${0.05 + (number * 0.05)})` }}>
      <div className="admin-funnel-number">{number}</div>
      <div className="admin-funnel-content">
        <div className="admin-funnel-label">{label}</div>
        <div className="admin-funnel-value">{count.toLocaleString()} users</div>
      </div>
      <div className="admin-funnel-percent" style={{ color: getPercentageColor(percentage) }}>
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
}

function getPercentageColor(percentage: number): string {
  if (percentage >= 50) return 'var(--admin-success)';
  if (percentage >= 20) return 'var(--admin-warning)';
  return 'var(--admin-danger)';
}

function getRetentionColor(rate: number): string {
  if (rate >= 50) return 'var(--admin-success)';
  if (rate >= 25) return 'var(--admin-warning)';
  return 'var(--admin-danger)';
}

function getRetentionGradient(rate: number): string {
  if (rate >= 50) return 'var(--admin-gradient-2)';
  if (rate >= 25) return 'var(--admin-gradient-3)';
  return 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
}

function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌍';
  }
}

