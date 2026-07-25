"use client";

import { useState } from "react";
import {
  Settings,
  DollarSign,
  Shield,
  Bell,
  Database,
  Globe,
  Key,
  Save,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Pricing
    monthlyPrice: 4.99,
    yearlyPrice: 39.99,
    
    // Referral
    referralDaysReward: 7,
    referralExpiryDays: 7,
    maxReferralsPerUser: 50,
    
    // AI Limits
    freeAiUsage: 5,
    proAiUsage: 100,
    
    // Moderation
    autoFlagRapidPosts: 5,
    autoFlagReferrals: 5,
    
    // Features
    enableReferrals: true,
    enablePremium: true,
    enableAI: true,
    maintenanceMode: false,
  });

  const handleSave = () => {
    // In production, this would save to database/env
    alert('Settings saved! (In production, this would persist to database)');
  };

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-subtitle">
          Configure your app settings and features
        </p>
      </div>

      <div className="admin-grid admin-grid-2">
        {/* Pricing Settings */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <DollarSign size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              Pricing
            </h3>
          </div>
          <div className="admin-card-body">
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Monthly Plan (EUR)
              </label>
              <input
                type="number"
                className="admin-input"
                value={settings.monthlyPrice}
                onChange={(e) => setSettings(s => ({ ...s, monthlyPrice: parseFloat(e.target.value) }))}
                step="0.01"
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Yearly Plan (EUR)
              </label>
              <input
                type="number"
                className="admin-input"
                value={settings.yearlyPrice}
                onChange={(e) => setSettings(s => ({ ...s, yearlyPrice: parseFloat(e.target.value) }))}
                step="0.01"
              />
            </div>
            <div style={{ padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
              Annual savings: {Math.round((1 - (settings.yearlyPrice / (settings.monthlyPrice * 12))) * 100)}%
            </div>
          </div>
        </div>

        {/* Referral Settings */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Globe size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              Referral Program
            </h3>
          </div>
          <div className="admin-card-body">
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Days Rewarded per Referral
              </label>
              <input
                type="number"
                className="admin-input"
                value={settings.referralDaysReward}
                onChange={(e) => setSettings(s => ({ ...s, referralDaysReward: parseInt(e.target.value) }))}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Referral Expiry (days)
              </label>
              <input
                type="number"
                className="admin-input"
                value={settings.referralExpiryDays}
                onChange={(e) => setSettings(s => ({ ...s, referralExpiryDays: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Max Referrals per User
              </label>
              <input
                type="number"
                className="admin-input"
                value={settings.maxReferralsPerUser}
                onChange={(e) => setSettings(s => ({ ...s, maxReferralsPerUser: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Key size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              AI Usage Limits
            </h3>
          </div>
          <div className="admin-card-body">
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Free Users (daily limit)
              </label>
              <input
                type="number"
                className="admin-input"
                value={settings.freeAiUsage}
                onChange={(e) => setSettings(s => ({ ...s, freeAiUsage: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Pro Users (daily limit)
              </label>
              <input
                type="number"
                className="admin-input"
                value={settings.proAiUsage}
                onChange={(e) => setSettings(s => ({ ...s, proAiUsage: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        {/* Moderation Settings */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Shield size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              Auto-Moderation
            </h3>
          </div>
          <div className="admin-card-body">
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Flag users with X+ catches/day
              </label>
              <input
                type="number"
                className="admin-input"
                value={settings.autoFlagRapidPosts}
                onChange={(e) => setSettings(s => ({ ...s, autoFlagRapidPosts: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Flag users with X+ referrals/week
              </label>
              <input
                type="number"
                className="admin-input"
                value={settings.autoFlagReferrals}
                onChange={(e) => setSettings(s => ({ ...s, autoFlagReferrals: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Settings size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              Feature Toggles
            </h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <ToggleCard
                label="Referral Program"
                description="Allow users to refer friends"
                enabled={settings.enableReferrals}
                onChange={(v) => setSettings(s => ({ ...s, enableReferrals: v }))}
              />
              <ToggleCard
                label="Premium Subscriptions"
                description="Enable premium features"
                enabled={settings.enablePremium}
                onChange={(v) => setSettings(s => ({ ...s, enablePremium: v }))}
              />
              <ToggleCard
                label="AI Features"
                description="Species ID and analysis"
                enabled={settings.enableAI}
                onChange={(v) => setSettings(s => ({ ...s, enableAI: v }))}
              />
              <ToggleCard
                label="Maintenance Mode"
                description="Show maintenance page"
                enabled={settings.maintenanceMode}
                onChange={(v) => setSettings(s => ({ ...s, maintenanceMode: v }))}
                danger
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="admin-btn admin-btn-secondary">
          <RefreshCw size={16} />
          Reset to Defaults
        </button>
        <button className="admin-btn admin-btn-primary" onClick={handleSave}>
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  );
}

function ToggleCard({ label, description, enabled, onChange, danger = false }: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div style={{ 
      padding: '16px', 
      background: 'var(--admin-bg-tertiary)', 
      borderRadius: 'var(--admin-radius-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    }}>
      <div>
        <div style={{ fontWeight: '500', color: 'var(--admin-text)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        style={{
          width: '48px',
          height: '28px',
          borderRadius: '14px',
          background: enabled 
            ? (danger ? 'var(--admin-danger)' : 'var(--admin-success)') 
            : 'var(--admin-border)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s ease',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: '4px',
            left: enabled ? '24px' : '4px',
            transition: 'left 0.2s ease',
          }}
        />
      </button>
    </div>
  );
}

