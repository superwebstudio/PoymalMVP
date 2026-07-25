"use client";

import {
  Fish,
  Heart,
  MessageCircle,
  Smile,
  UserPlus,
  TrendingUp,
  Clock,
  Users,
  Zap,
} from "lucide-react";

interface EngagementData {
  totals: {
    catches: number;
    likes: number;
    comments: number;
    reactions: number;
    follows: number;
  };
  thisWeek: {
    catches: number;
    likes: number;
    comments: number;
  };
  segments: {
    deadUsers: number;
    casualUsers: number;
    regularUsers: number;
    powerUsers: number;
    total: number;
  };
  averages: {
    catchesPerUser: number;
    likesPerCatch: number;
    commentsPerCatch: number;
  };
  dailyActivity: { date: string; catches: number; likes: number; comments: number }[];
  topCatches: {
    id: string;
    species: string | null;
    imageUrl: string | null;
    user: { firstName: string | null; username: string | null; photoUrl: string | null };
    likesCount: number;
    commentsCount: number;
  }[];
  activityByHour: { hour: number; count: number }[];
  topMethods: { method: string; count: number }[];
}

export function EngagementClient({ data }: { data: EngagementData }) {
  const maxActivity = Math.max(...data.dailyActivity.map(d => Math.max(d.catches, d.likes, d.comments)), 1);
  const maxHourlyActivity = Math.max(...data.activityByHour.map(h => h.count), 1);

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Engagement</h1>
        <p className="admin-page-subtitle">
          Track user activity and content engagement
        </p>
      </div>

      {/* Total Engagement Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-1)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Catches</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--admin-accent)' }}>
              <Fish size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.totals.catches.toLocaleString()}</div>
          <span className="admin-stat-change positive">
            +{data.thisWeek.catches} this week
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Likes</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <Heart size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.totals.likes.toLocaleString()}</div>
          <span className="admin-stat-change positive">
            +{data.thisWeek.likes} this week
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-4)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Comments</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}>
              <MessageCircle size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.totals.comments.toLocaleString()}</div>
          <span className="admin-stat-change positive">
            +{data.thisWeek.comments} this week
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-2)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Follows</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--admin-success)' }}>
              <UserPlus size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.totals.follows.toLocaleString()}</div>
        </div>
      </div>

      {/* Activity Trends */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Activity Trend (30 Days)</h3>
        </div>
        <div className="admin-card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '200px', marginBottom: '16px' }}>
            {data.dailyActivity.map((d) => (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  gap: '1px',
                  height: '100%',
                }}
                title={`${d.date}\nCatches: ${d.catches}\nLikes: ${d.likes}\nComments: ${d.comments}`}
              >
                <div style={{ height: `${(d.catches / maxActivity) * 100}%`, minHeight: d.catches > 0 ? '2px' : '1px', background: d.catches > 0 ? 'var(--admin-accent)' : 'var(--admin-bg-tertiary)', borderRadius: '1px' }} />
                <div style={{ height: `${(d.likes / maxActivity) * 100}%`, minHeight: d.likes > 0 ? '2px' : '1px', background: d.likes > 0 ? '#ef4444' : 'var(--admin-bg-tertiary)', borderRadius: '1px' }} />
                <div style={{ height: `${(d.comments / maxActivity) * 100}%`, minHeight: d.comments > 0 ? '2px' : '1px', background: d.comments > 0 ? '#a855f7' : 'var(--admin-bg-tertiary)', borderRadius: '1px' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
            <span><span style={{ width: '12px', height: '12px', background: 'var(--admin-accent)', display: 'inline-block', borderRadius: '2px', marginRight: '6px' }} />Catches</span>
            <span><span style={{ width: '12px', height: '12px', background: '#ef4444', display: 'inline-block', borderRadius: '2px', marginRight: '6px' }} />Likes</span>
            <span><span style={{ width: '12px', height: '12px', background: '#a855f7', display: 'inline-block', borderRadius: '2px', marginRight: '6px' }} />Comments</span>
          </div>
        </div>
      </div>

      <div className="admin-grid admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* User Segments */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">User Segments</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SegmentRow 
                icon={<Zap size={18} />}
                label="Power Users" 
                description="3+ catches/week"
                count={data.segments.powerUsers} 
                total={data.segments.total}
                color="var(--admin-success)"
              />
              <SegmentRow 
                icon={<TrendingUp size={18} />}
                label="Regular Users" 
                description="1+ catch/week"
                count={data.segments.regularUsers} 
                total={data.segments.total}
                color="var(--admin-accent)"
              />
              <SegmentRow 
                icon={<Users size={18} />}
                label="Casual Users" 
                description="1-2 catches/month"
                count={data.segments.casualUsers} 
                total={data.segments.total}
                color="var(--admin-warning)"
              />
              <SegmentRow 
                icon={<Clock size={18} />}
                label="Inactive Users" 
                description="30+ days no activity"
                count={data.segments.deadUsers} 
                total={data.segments.total}
                color="var(--admin-danger)"
              />
            </div>
          </div>
        </div>

        {/* Averages */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Engagement Averages</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <AverageCard
                label="Catches/User"
                value={data.averages.catchesPerUser}
                icon={<Fish size={20} />}
                color="var(--admin-accent)"
              />
              <AverageCard
                label="Likes/Catch"
                value={data.averages.likesPerCatch}
                icon={<Heart size={20} />}
                color="#ef4444"
              />
              <AverageCard
                label="Comments/Catch"
                value={data.averages.commentsPerCatch}
                icon={<MessageCircle size={20} />}
                color="#a855f7"
              />
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '12px' }}>
              Top Fishing Methods
            </h4>
            {data.topMethods.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.topMethods.map((method, i) => {
                  const max = data.topMethods[0]?.count || 1;
                  return (
                    <div key={method.method}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', textTransform: 'capitalize' }}>
                          {method.method}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-text)' }}>
                          {method.count}
                        </span>
                      </div>
                      <div className="admin-progress" style={{ height: '4px' }}>
                        <div 
                          className="admin-progress-bar accent" 
                          style={{ width: `${(method.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>No method data yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-grid admin-grid-2">
        {/* Activity by Hour */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Activity by Hour</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '150px', marginBottom: '8px' }}>
              {data.activityByHour.map((h) => (
                <div
                  key={h.hour}
                  style={{
                    flex: 1,
                    height: `${(h.count / maxHourlyActivity) * 100}%`,
                    minHeight: h.count > 0 ? '4px' : '2px',
                    background: h.count > 0 
                      ? `rgba(14, 165, 233, ${0.3 + (h.count / maxHourlyActivity) * 0.7})`
                      : 'var(--admin-bg-tertiary)',
                    borderRadius: '2px',
                  }}
                  title={`${h.hour}:00 - ${h.count} catches`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--admin-text-muted)' }}>
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
              Peak activity: <strong style={{ color: 'var(--admin-accent)' }}>
                {getPeakHour(data.activityByHour)}
              </strong>
            </div>
          </div>
        </div>

        {/* Top Catches */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Most Engaged Catches</h3>
          </div>
          <div className="admin-card-body">
            {data.topCatches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.topCatches.map((catchItem, i) => (
                  <div key={catchItem.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < 3 ? 'var(--admin-gradient-3)' : 'var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: i < 3 ? 'white' : 'var(--admin-text-muted)' }}>
                      {i + 1}
                    </div>
                    {catchItem.imageUrl ? (
                      <img 
                        src={catchItem.imageUrl} 
                        alt="" 
                        style={{ width: '48px', height: '48px', borderRadius: 'var(--admin-radius-sm)', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--admin-radius-sm)', background: 'var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Fish size={20} style={{ color: 'var(--admin-text-muted)' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: 'var(--admin-text)' }}>
                        {catchItem.species || 'Unknown species'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                        by {catchItem.user.firstName || catchItem.user.username || 'Unknown'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                      <span style={{ color: '#ef4444' }}>❤️ {catchItem.likesCount}</span>
                      <span style={{ color: '#a855f7' }}>💬 {catchItem.commentsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                No catches yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentRow({ icon, label, description, count, total, color }: { icon: React.ReactNode; label: string; description: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--admin-text)' }}>{label}</span>
          <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color }}>{count} ({percentage.toFixed(1)}%)</span>
        </div>
        <div className="admin-progress" style={{ height: '6px' }}>
          <div className="admin-progress-bar" style={{ width: `${percentage}%`, background: color }} />
        </div>
        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>{description}</div>
      </div>
    </div>
  );
}

function AverageCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ padding: '16px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', textAlign: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, margin: '0 auto 8px' }}>
        {icon}
      </div>
      <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-text)' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{label}</div>
    </div>
  );
}

function getPeakHour(hourlyData: { hour: number; count: number }[]): string {
  if (hourlyData.length === 0) return 'No data';
  const peak = hourlyData.reduce((max, h) => h.count > max.count ? h : max, hourlyData[0]);
  return `${peak.hour.toString().padStart(2, '0')}:00 - ${(peak.hour + 1).toString().padStart(2, '0')}:00`;
}

