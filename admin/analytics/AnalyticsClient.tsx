"use client";

import { useState } from "react";
import {
  TrendingUp,
  Users,
  Fish,
  MapPin,
  Globe,
  Crown,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
} from "lucide-react";

interface AnalyticsData {
  signupsTrend: { date: string; value: number }[];
  catchesTrend: { date: string; value: number }[];
  dauTrend: { date: string; value: number }[];
  featureUsage: {
    catchPosted: number;
    likesGiven: number;
    commentsPosted: number;
    followsCreated: number;
    referralsGenerated: number;
  };
  topSpecies: { name: string; count: number }[];
  topLocations: { name: string; count: number }[];
  countryDistribution: { country: string; count: number }[];
  premiumDistribution: { type: string; count: number }[];
}

interface AnalyticsClientProps {
  data: AnalyticsData;
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const [selectedMetric, setSelectedMetric] = useState<'signups' | 'catches' | 'dau'>('signups');

  const chartData = {
    signups: data.signupsTrend,
    catches: data.catchesTrend,
    dau: data.dauTrend,
  };

  const currentData = chartData[selectedMetric];
  const maxValue = Math.max(...currentData.map(d => d.value), 1);
  const total = currentData.reduce((sum, d) => sum + d.value, 0);
  const avg = Math.round(total / currentData.length);

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Analytics</h1>
        <p className="admin-page-subtitle">
          Deep dive into your app&apos;s performance metrics
        </p>
      </div>

      {/* Trend Chart */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">30-Day Trends</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['signups', 'catches', 'dau'] as const).map((metric) => (
              <button
                key={metric}
                className={`admin-btn ${selectedMetric === metric ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}
                onClick={() => setSelectedMetric(metric)}
              >
                {metric === 'signups' && 'Signups'}
                {metric === 'catches' && 'Catches'}
                {metric === 'dau' && 'DAU'}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-card-body">
          {/* Simple bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '200px', marginBottom: '16px' }}>
            {currentData.map((d, i) => (
              <div
                key={d.date}
                style={{
                  flex: 1,
                  background: `linear-gradient(to top, var(--admin-accent), rgba(14, 165, 233, 0.3))`,
                  height: `${Math.max((d.value / maxValue) * 100, 2)}%`,
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  transition: 'height 0.3s ease',
                }}
                title={`${d.date}: ${d.value}`}
              />
            ))}
          </div>
          
          {/* Stats */}
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Total (30 days)</span>
              <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>{total.toLocaleString()}</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Daily Average</span>
              <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>{avg.toLocaleString()}</div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Today</span>
              <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>{currentData[currentData.length - 1]?.value || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Usage */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Feature Usage (Last 30 Days)</h3>
        </div>
        <div className="admin-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <FeatureCard icon={<Fish size={20} />} label="Catches Posted" value={data.featureUsage.catchPosted} color="var(--admin-accent)" />
            <FeatureCard icon={<Heart size={20} />} label="Likes Given" value={data.featureUsage.likesGiven} color="#ef4444" />
            <FeatureCard icon={<MessageCircle size={20} />} label="Comments Posted" value={data.featureUsage.commentsPosted} color="#8b5cf6" />
            <FeatureCard icon={<UserPlus size={20} />} label="Follows Created" value={data.featureUsage.followsCreated} color="#22c55e" />
            <FeatureCard icon={<Share2 size={20} />} label="Referrals Generated" value={data.featureUsage.referralsGenerated} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Two column grid */}
      <div className="admin-grid admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* Top Species */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Top Species</h3>
          </div>
          <div className="admin-card-body">
            {data.topSpecies.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.topSpecies.map((species, i) => {
                  const maxCount = data.topSpecies[0]?.count || 1;
                  return (
                    <div key={species.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--admin-text)' }}>
                          {i + 1}. {species.name}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-accent)' }}>
                          {species.count}
                        </span>
                      </div>
                      <div className="admin-progress">
                        <div 
                          className="admin-progress-bar accent" 
                          style={{ width: `${(species.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No catches recorded yet" />
            )}
          </div>
        </div>

        {/* Top Locations */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Top Locations</h3>
          </div>
          <div className="admin-card-body">
            {data.topLocations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.topLocations.map((location, i) => {
                  const maxCount = data.topLocations[0]?.count || 1;
                  return (
                    <div key={location.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--admin-text)' }}>
                          <MapPin size={14} style={{ display: 'inline', marginRight: '6px', opacity: 0.5 }} />
                          {location.name}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-success)' }}>
                          {location.count}
                        </span>
                      </div>
                      <div className="admin-progress">
                        <div 
                          className="admin-progress-bar success" 
                          style={{ width: `${(location.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No location data yet" />
            )}
          </div>
        </div>
      </div>

      {/* Country & Premium Distribution */}
      <div className="admin-grid admin-grid-2">
        {/* Country Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Users by Country</h3>
          </div>
          <div className="admin-card-body">
            {data.countryDistribution.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.countryDistribution.map((item, i) => {
                  const maxCount = data.countryDistribution[0]?.count || 1;
                  return (
                    <div key={item.country}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--admin-text)' }}>
                          {getCountryFlag(item.country)} {item.country}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-text-secondary)' }}>
                          {item.count}
                        </span>
                      </div>
                      <div className="admin-progress">
                        <div 
                          className="admin-progress-bar" 
                          style={{ width: `${(item.count / maxCount) * 100}%`, background: 'var(--admin-gradient-4)' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No country data yet" />
            )}
          </div>
        </div>

        {/* Premium Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Premium Subscriptions</h3>
          </div>
          <div className="admin-card-body">
            {data.premiumDistribution.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.premiumDistribution.map((item) => (
                  <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: item.type === 'yearly' ? 'var(--admin-gradient-3)' : 'var(--admin-gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={24} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--admin-text)', textTransform: 'capitalize' }}>
                        {item.type || 'Unknown'} Plan
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                        {item.type === 'yearly' ? '€39.99/year' : '€4.99/month'}
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-warning)' }}>
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No premium subscribers yet" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ padding: '20px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--admin-text)' }}>
          {value.toLocaleString()}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
      {message}
    </div>
  );
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

