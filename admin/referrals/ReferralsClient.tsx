"use client";

import {
  Share2,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Gift,
  Crown,
  TrendingUp,
} from "lucide-react";

interface ReferralsData {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  expiredReferrals: number;
  referralsThisWeek: number;
  completedThisWeek: number;
  totalDaysAwarded: number;
  totalCost: number;
  conversionRate: number;
  topReferrers: {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    totalCompletedReferrals: number;
    premiumDaysBalance: number;
    isPro: boolean;
  }[];
  dailyReferrals: { date: string; created: number; completed: number }[];
  recentReferrals: {
    id: string;
    referrer: { firstName: string | null; username: string | null; photoUrl: string | null };
    referred: { firstName: string | null; username: string | null; photoUrl: string | null };
    status: string;
    createdAt: Date;
    expiresAt: Date;
    firstPostAt: Date | null;
    daysAwarded: number;
  }[];
  topDaysBalance: {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    premiumDaysBalance: number;
  }[];
}

export function ReferralsClient({ data }: { data: ReferralsData }) {
  const maxReferrals = Math.max(...data.dailyReferrals.map(d => Math.max(d.created, d.completed)), 1);

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Referrals</h1>
        <p className="admin-page-subtitle">
          Track referral program performance and rewards
        </p>
      </div>

      {/* Key Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-1)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Referrals</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--admin-accent)' }}>
              <Share2 size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.totalReferrals}</div>
          <span className="admin-stat-change positive">
            +{data.referralsThisWeek} this week
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-2)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Completed</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--admin-success)' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.completedReferrals}</div>
          <span className="admin-stat-change positive">
            +{data.completedThisWeek} this week
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-3)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Conversion Rate</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--admin-warning)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.conversionRate}%</div>
          <span className="admin-stat-change neutral">
            Signup → First post
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-4)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Days Awarded</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}>
              <Gift size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.totalDaysAwarded}</div>
          <span className="admin-stat-change neutral">
            Cost: €{data.totalCost}
          </span>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Referral Status Breakdown</h3>
        </div>
        <div className="admin-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <StatusCard
              icon={<CheckCircle size={20} />}
              label="Completed"
              count={data.completedReferrals}
              total={data.totalReferrals}
              color="var(--admin-success)"
            />
            <StatusCard
              icon={<Clock size={20} />}
              label="Pending"
              count={data.pendingReferrals}
              total={data.totalReferrals}
              color="var(--admin-warning)"
            />
            <StatusCard
              icon={<XCircle size={20} />}
              label="Expired"
              count={data.expiredReferrals}
              total={data.totalReferrals}
              color="var(--admin-danger)"
            />
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Referrals Trend (30 Days)</h3>
        </div>
        <div className="admin-card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px', marginBottom: '16px' }}>
            {data.dailyReferrals.map((d) => (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  height: '100%',
                  gap: '2px',
                }}
                title={`${d.date}: ${d.created} created, ${d.completed} completed`}
              >
                <div
                  style={{
                    height: `${(d.created / maxReferrals) * 100}%`,
                    minHeight: d.created > 0 ? '4px' : '2px',
                    background: d.created > 0 ? 'var(--admin-accent)' : 'var(--admin-bg-tertiary)',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.4,
                  }}
                />
                <div
                  style={{
                    height: `${(d.completed / maxReferrals) * 100}%`,
                    minHeight: d.completed > 0 ? '4px' : '2px',
                    background: d.completed > 0 ? 'var(--admin-success)' : 'var(--admin-bg-tertiary)',
                    borderRadius: '2px 2px 0 0',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
            <span><span style={{ width: '12px', height: '12px', background: 'var(--admin-accent)', display: 'inline-block', borderRadius: '2px', marginRight: '6px', opacity: 0.4 }} />Created</span>
            <span><span style={{ width: '12px', height: '12px', background: 'var(--admin-success)', display: 'inline-block', borderRadius: '2px', marginRight: '6px' }} />Completed</span>
          </div>
        </div>
      </div>

      <div className="admin-grid admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* Top Referrers */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Top Referrers</h3>
          </div>
          <div className="admin-card-body">
            {data.topReferrers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.topReferrers.map((user, i) => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < 3 ? 'var(--admin-gradient-3)' : 'var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: i < 3 ? 'white' : 'var(--admin-text-muted)' }}>
                      {i + 1}
                    </div>
                    <div className="admin-user-avatar">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt="" />
                      ) : (
                        user.firstName?.[0] || '?'
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {user.firstName || user.username || 'Unknown'}
                        {user.isPro && <Crown size={14} style={{ color: 'var(--admin-warning)' }} />}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                        {user.premiumDaysBalance} days earned
                      </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-success)' }}>
                      {user.totalCompletedReferrals}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                No referrals completed yet
              </div>
            )}
          </div>
        </div>

        {/* Pending Days Balance */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Top Premium Days Balance</h3>
          </div>
          <div className="admin-card-body">
            {data.topDaysBalance.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.topDaysBalance.map((user) => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div className="admin-user-avatar">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt="" />
                      ) : (
                        user.firstName?.[0] || '?'
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: 'var(--admin-text)' }}>
                        {user.firstName || user.username || 'Unknown'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Gift size={16} style={{ color: '#a855f7' }} />
                      <span style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#a855f7' }}>
                        {user.premiumDaysBalance}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>days</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                No pending days balance
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Recent Referrals</h3>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Referrer</th>
                <th>Referred</th>
                <th>Status</th>
                <th>Days Awarded</th>
                <th>Created</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {data.recentReferrals.length > 0 ? (
                data.recentReferrals.map((referral) => (
                  <tr key={referral.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                          {referral.referrer.photoUrl ? (
                            <img src={referral.referrer.photoUrl} alt="" />
                          ) : (
                            referral.referrer.firstName?.[0] || '?'
                          )}
                        </div>
                        <span style={{ color: 'var(--admin-text)' }}>{referral.referrer.firstName || referral.referrer.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                          {referral.referred.photoUrl ? (
                            <img src={referral.referred.photoUrl} alt="" />
                          ) : (
                            referral.referred.firstName?.[0] || '?'
                          )}
                        </div>
                        <span style={{ color: 'var(--admin-text)' }}>{referral.referred.firstName || referral.referred.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${referral.status === 'completed' ? 'active' : referral.status === 'expired' ? 'banned' : 'warning'}`}>
                        {referral.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '500', color: referral.daysAwarded > 0 ? 'var(--admin-success)' : 'var(--admin-text-muted)' }}>
                      {referral.daysAwarded > 0 ? `+${referral.daysAwarded}` : '-'}
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>{formatDate(new Date(referral.createdAt))}</td>
                    <td style={{ color: new Date(referral.expiresAt) < new Date() ? 'var(--admin-danger)' : 'var(--admin-text-muted)' }}>
                      {formatDate(new Date(referral.expiresAt))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--admin-text-muted)' }}>
                    No referrals yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, count, total, color }: { icon: React.ReactNode; label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div style={{ padding: '20px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', textAlign: 'center' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, margin: '0 auto 12px' }}>
        {icon}
      </div>
      <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-text)', marginBottom: '4px' }}>
        {count}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
        {label} ({percentage.toFixed(0)}%)
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

