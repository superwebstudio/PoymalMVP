"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Shield,
  Users,
  Fish,
  MapPinOff,
  Zap,
  UserX,
  EyeOff,
  Ban,
  Trash2,
  Eye,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

interface ModerationData {
  flags: {
    suspiciousReferrers: number;
    rapidPosters: number;
    noGpsCatches: number;
    testAccounts: number;
    hiddenContent: number;
  };
  suspiciousReferrers: {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    totalCompletedReferrals: number;
    createdAt: Date;
  }[];
  rapidPosters: {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    catchesToday: number;
  }[];
  noGpsCatches: {
    id: string;
    species: string | null;
    imageUrl: string | null;
    createdAt: Date;
    user: {
      id: string;
      firstName: string | null;
      username: string | null;
      photoUrl: string | null;
    };
  }[];
  suspiciousAccounts: {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    createdAt: Date;
    catchCount: number;
  }[];
  flaggedContent: {
    id: string;
    species: string | null;
    imageUrl: string | null;
    createdAt: Date;
    user: {
      id: string;
      firstName: string | null;
      username: string | null;
      photoUrl: string | null;
    };
  }[];
  stats: {
    totalUsersToday: number;
    totalCatchesToday: number;
  };
}

export function ModerationClient({ data }: { data: ModerationData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'rapid' | 'nogps' | 'test' | 'hidden'>('overview');

  const totalFlags = Object.values(data.flags).reduce((a, b) => a + b, 0);

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Moderation</h1>
        <p className="admin-page-subtitle">
          Review and manage flagged content and suspicious activity
        </p>
      </div>

      {/* Summary Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card" style={{ '--stat-gradient': totalFlags > 0 ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' : 'var(--admin-gradient-2)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Flags</span>
            <div className="admin-stat-icon" style={{ background: totalFlags > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: totalFlags > 0 ? 'var(--admin-danger)' : 'var(--admin-success)' }}>
              {totalFlags > 0 ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            </div>
          </div>
          <div className="admin-stat-value">{totalFlags}</div>
          <span className={`admin-stat-change ${totalFlags > 0 ? 'negative' : 'positive'}`}>
            {totalFlags > 0 ? 'Requires review' : 'All clear'}
          </span>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-1)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">New Users Today</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--admin-accent)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.stats.totalUsersToday}</div>
        </div>

        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-4)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Catches Today</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}>
              <Fish size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{data.stats.totalCatchesToday}</div>
        </div>
      </div>

      {/* Flag Summary Cards */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Flags Summary</h3>
        </div>
        <div className="admin-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <FlagCard
              icon={<Users size={20} />}
              label="Suspicious Referrers"
              count={data.flags.suspiciousReferrers}
              description="5+ referrals in past week"
              onClick={() => setActiveTab('referrals')}
              active={activeTab === 'referrals'}
            />
            <FlagCard
              icon={<Zap size={20} />}
              label="Rapid Posters"
              count={data.flags.rapidPosters}
              description="5+ catches today"
              onClick={() => setActiveTab('rapid')}
              active={activeTab === 'rapid'}
            />
            <FlagCard
              icon={<MapPinOff size={20} />}
              label="No GPS Data"
              count={data.flags.noGpsCatches}
              description="Photos without location"
              onClick={() => setActiveTab('nogps')}
              active={activeTab === 'nogps'}
            />
            <FlagCard
              icon={<UserX size={20} />}
              label="Test Accounts"
              count={data.flags.testAccounts}
              description="Suspicious usernames"
              onClick={() => setActiveTab('test')}
              active={activeTab === 'test'}
            />
            <FlagCard
              icon={<EyeOff size={20} />}
              label="Hidden Content"
              count={data.flags.hiddenContent}
              description="Private catches this week"
              onClick={() => setActiveTab('hidden')}
              active={activeTab === 'hidden'}
            />
          </div>
        </div>
      </div>

      {/* Detail Section */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            {activeTab === 'overview' && 'Select a flag category to review'}
            {activeTab === 'referrals' && 'Suspicious Referrers'}
            {activeTab === 'rapid' && 'Rapid Posters'}
            {activeTab === 'nogps' && 'Catches Without GPS'}
            {activeTab === 'test' && 'Test Accounts'}
            {activeTab === 'hidden' && 'Hidden Content'}
          </h3>
        </div>
        <div className="admin-card-body">
          {activeTab === 'overview' && (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Click on a flag category above to review items</p>
            </div>
          )}

          {activeTab === 'referrals' && (
            data.suspiciousReferrers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.suspiciousReferrers.map((user) => (
                  <FlaggedUserRow
                    key={user.id}
                    user={user}
                    detail={`${user.totalCompletedReferrals} completed referrals`}
                    onView={() => router.push(`/user/${user.id}`)}
                    onBan={() => {/* Implement ban */}}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No suspicious referral activity detected" />
            )
          )}

          {activeTab === 'rapid' && (
            data.rapidPosters.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.rapidPosters.map((user) => (
                  <FlaggedUserRow
                    key={user.id}
                    user={user}
                    detail={`${user.catchesToday} catches today`}
                    onView={() => router.push(`/user/${user.id}`)}
                    onBan={() => {/* Implement ban */}}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No rapid posting activity detected" />
            )
          )}

          {activeTab === 'nogps' && (
            data.noGpsCatches.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {data.noGpsCatches.map((catchItem) => (
                  <FlaggedCatchCard
                    key={catchItem.id}
                    catchItem={catchItem}
                    onView={() => window.open(`/catch/${catchItem.id}`, '_blank')}
                    onDelete={async () => {
                      await fetch(`/api/admin/catches/${catchItem.id}`, { method: 'DELETE' });
                      router.refresh();
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No catches without GPS data" />
            )
          )}

          {activeTab === 'test' && (
            data.suspiciousAccounts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.suspiciousAccounts.map((user) => (
                  <FlaggedUserRow
                    key={user.id}
                    user={user}
                    detail={`${user.catchCount} catches`}
                    onView={() => router.push(`/user/${user.id}`)}
                    onBan={() => {/* Implement delete */}}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No suspicious test accounts detected" />
            )
          )}

          {activeTab === 'hidden' && (
            data.flaggedContent.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {data.flaggedContent.map((catchItem) => (
                  <FlaggedCatchCard
                    key={catchItem.id}
                    catchItem={catchItem}
                    onView={() => window.open(`/catch/${catchItem.id}`, '_blank')}
                    onDelete={async () => {
                      await fetch(`/api/admin/catches/${catchItem.id}`, { method: 'DELETE' });
                      router.refresh();
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No hidden content to review" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function FlagCard({ icon, label, count, description, onClick, active }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  description: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '20px',
        background: active ? 'rgba(14, 165, 233, 0.1)' : 'var(--admin-bg-tertiary)',
        borderRadius: 'var(--admin-radius-sm)',
        textAlign: 'left',
        cursor: 'pointer',
        border: active ? '1px solid var(--admin-accent)' : '1px solid transparent',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: count > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: count > 0 ? 'var(--admin-warning)' : 'var(--admin-success)' }}>
          {icon}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: count > 0 ? 'var(--admin-warning)' : 'var(--admin-success)' }}>
          {count}
        </div>
      </div>
      <div style={{ fontWeight: '600', color: 'var(--admin-text)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{description}</div>
    </button>
  );
}

function FlaggedUserRow({ user, detail, onView, onBan }: {
  user: { id: string; firstName: string | null; username: string | null; photoUrl: string | null };
  detail: string;
  onView: () => void;
  onBan: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
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
        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{detail}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={onView}>
          <Eye size={14} />
          View
        </button>
        <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={onBan}>
          <Ban size={14} />
          Ban
        </button>
      </div>
    </div>
  );
}

function FlaggedCatchCard({ catchItem, onView, onDelete }: {
  catchItem: {
    id: string;
    species: string | null;
    imageUrl: string | null;
    user: { firstName: string | null; username: string | null; photoUrl: string | null };
  };
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', overflow: 'hidden' }}>
      <div style={{ position: 'relative', paddingTop: '100%', background: 'var(--admin-bg)' }}>
        {catchItem.imageUrl ? (
          <img src={catchItem.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)' }}>
            <Fish size={32} />
          </div>
        )}
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div className="admin-user-avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
            {catchItem.user.photoUrl ? (
              <img src={catchItem.user.photoUrl} alt="" />
            ) : (
              catchItem.user.firstName?.[0] || '?'
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
            {catchItem.user.firstName || catchItem.user.username || 'Unknown'}
          </span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--admin-text)', marginBottom: '8px' }}>
          {catchItem.species || 'Unknown'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="admin-btn admin-btn-secondary admin-btn-sm" style={{ flex: 1 }} onClick={onView}>
            <ExternalLink size={12} />
            View
          </button>
          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={onDelete}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
      <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5, color: 'var(--admin-success)' }} />
      <p>{message}</p>
    </div>
  );
}

