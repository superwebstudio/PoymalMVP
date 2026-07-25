"use client";

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Crown,
  Users,
  CreditCard,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

interface RevenueData {
  totalMRR: number;
  monthlyMRR: number;
  yearlyMRR: number;
  totalPremium: number;
  monthlyPremium: number;
  yearlyPremium: number;
  totalFree: number;
  arpu: number;
  ltv: number;
  conversionRate: number;
  newPremiumThisMonth: number;
  newPremiumLastMonth: number;
  monthOverMonthGrowth: number;
  dailyRevenue: { date: string; revenue: number; transactions: number }[];
  recentTransactions: {
    id: string;
    amount: number;
    type: string;
    status: string;
    createdAt: Date;
    user: { firstName: string | null; username: string | null; photoUrl: string | null };
  }[];
  funnel: {
    totalUsers: number;
    usersWithCatches: number;
    activatedUsers: number;
    premiumUsers: number;
  };
}

export function RevenueClient({ data }: { data: RevenueData }) {
  const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.revenue), 1);
  const totalRevenue30Days = data.dailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
  
  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Revenue</h1>
        <p className="admin-page-subtitle">
          Monitor your subscription revenue and conversions
        </p>
      </div>

      {/* Key Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-3)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Monthly Recurring Revenue</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--admin-warning)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="admin-stat-value">€{data.totalMRR.toLocaleString()}</div>
          <span className={`admin-stat-change ${data.monthOverMonthGrowth >= 0 ? 'positive' : 'negative'}`}>
            {data.monthOverMonthGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {data.monthOverMonthGrowth >= 0 ? '+' : ''}{data.monthOverMonthGrowth}% vs last month
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-1)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Premium Subscribers</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--admin-accent)' }}>
              <Crown size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.totalPremium}</div>
          <span className="admin-stat-change positive">
            +{data.newPremiumThisMonth} this month
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-2)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Conversion Rate</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--admin-success)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.conversionRate}%</div>
          <span className="admin-stat-change neutral">
            Free → Premium
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-4)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Customer Lifetime Value</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="admin-stat-value">€{data.ltv}</div>
          <span className="admin-stat-change neutral">
            ARPU: €{data.arpu}
          </span>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Daily Revenue (30 Days)</h3>
          <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>
            Total: <span style={{ fontWeight: '600', color: 'var(--admin-success)', fontFamily: 'JetBrains Mono, monospace' }}>€{totalRevenue30Days.toFixed(2)}</span>
          </div>
        </div>
        <div className="admin-card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '200px', marginBottom: '16px' }}>
            {data.dailyRevenue.map((d) => (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  height: `${Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 5 : 2)}%`,
                  background: d.revenue > 0 
                    ? 'linear-gradient(to top, #22c55e, rgba(34, 197, 94, 0.3))'
                    : 'var(--admin-bg-tertiary)',
                  borderRadius: '4px 4px 0 0',
                }}
                title={`${d.date}: €${d.revenue.toFixed(2)} (${d.transactions} transactions)`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="admin-grid admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* Subscription Breakdown */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Subscription Breakdown</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Monthly */}
              <div style={{ padding: '16px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--admin-gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--admin-text)' }}>Monthly Plan</div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>€4.99/month</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-accent)' }}>{data.monthlyPremium}</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>€{data.monthlyMRR}/mo</div>
                </div>
              </div>
              
              {/* Yearly */}
              <div style={{ padding: '16px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--admin-gradient-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Crown size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--admin-text)' }}>Annual Plan</div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>€39.99/year</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-warning)' }}>{data.yearlyPremium}</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>€{data.yearlyMRR}/mo</div>
                </div>
              </div>

              {/* Free users */}
              <div style={{ padding: '16px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} color="var(--admin-text-muted)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--admin-text)' }}>Free Users</div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>Potential conversions</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-text-muted)' }}>{data.totalFree}</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>€0/mo</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Premium Conversion Funnel</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-funnel">
              <FunnelStep
                label="All Users"
                count={data.funnel.totalUsers}
                percentage={100}
              />
              <FunnelStep
                label="Posted 1+ Catch"
                count={data.funnel.usersWithCatches}
                percentage={data.funnel.totalUsers > 0 ? (data.funnel.usersWithCatches / data.funnel.totalUsers) * 100 : 0}
              />
              <FunnelStep
                label="Activated (3+)"
                count={data.funnel.activatedUsers}
                percentage={data.funnel.totalUsers > 0 ? (data.funnel.activatedUsers / data.funnel.totalUsers) * 100 : 0}
              />
              <FunnelStep
                label="Premium"
                count={data.funnel.premiumUsers}
                percentage={data.funnel.totalUsers > 0 ? (data.funnel.premiumUsers / data.funnel.totalUsers) * 100 : 0}
                isLast
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Recent Transactions</h3>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {tx.user.photoUrl ? (
                            <img src={tx.user.photoUrl} alt="" />
                          ) : (
                            tx.user.firstName?.[0] || '?'
                          )}
                        </div>
                        <div className="admin-user-info">
                          <span className="admin-user-name">{tx.user.firstName || 'Unknown'}</span>
                          <span className="admin-user-username">@{tx.user.username || 'no-username'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge pro">
                        {tx.type === 'yearly' ? 'Annual' : 'Monthly'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', color: 'var(--admin-success)' }}>
                      €{tx.type === 'yearly' ? '39.99' : '4.99'}
                    </td>
                    <td>
                      <span className={`admin-badge ${tx.status === 'completed' ? 'active' : tx.status === 'failed' ? 'banned' : 'warning'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{formatDate(new Date(tx.createdAt))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--admin-text-muted)' }}>
                    No transactions yet
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

function FunnelStep({ label, count, percentage, isLast = false }: { label: string; count: number; percentage: number; isLast?: boolean }) {
  return (
    <div className="admin-funnel-step">
      <div className="admin-funnel-content" style={{ flex: 1 }}>
        <div className="admin-funnel-label">{label}</div>
        <div className="admin-funnel-value">{count.toLocaleString()}</div>
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

