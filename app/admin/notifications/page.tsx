"use client";

import { useState } from "react";
import {
  Bell,
  Send,
  Users,
  Fish,
  Crown,
  Clock,
  TrendingUp,
  Plus,
  Trash2,
} from "lucide-react";
import { useNotificationStore } from "@/stores/useNotificationStore";

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  target: 'all' | 'premium' | 'free' | 'inactive';
  icon: React.ReactNode;
}

const notificationTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: 'Weather Alert',
    title: 'Perfect fishing weather today! 🎣',
    body: 'Clear skies and calm winds - ideal conditions for your next catch.',
    target: 'all',
    icon: <TrendingUp size={20} />,
  },
  {
    id: '2',
    name: 'Re-engagement',
    title: 'We miss you! 🐟',
    body: "It's been a while since your last catch. Check out what others are catching near you!",
    target: 'inactive',
    icon: <Clock size={20} />,
  },
  {
    id: '3',
    name: 'Premium Promo',
    title: 'Unlock Premium Features ⭐',
    body: 'Get advanced weather forecasts, unlimited species ID, and more!',
    target: 'free',
    icon: <Crown size={20} />,
  },
  {
    id: '4',
    name: 'New Feature',
    title: 'New feature available!',
    body: 'Check out our latest update with improved maps and analytics.',
    target: 'all',
    icon: <Bell size={20} />,
  },
];

export default function NotificationsPage() {
  const { addNotification } = useNotificationStore();
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customTarget, setCustomTarget] = useState<'all' | 'premium' | 'free' | 'inactive'>('all');

  const handleSendNotification = async () => {
    // In production, this would call an API to send push notifications
    addNotification({
      message: `Notification would be sent to ${customTarget} users:\n\nTitle: ${customTitle || selectedTemplate?.title}\nBody: ${customBody || selectedTemplate?.body}`,
      type: 'info',
    });
  };

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Notifications</h1>
        <p className="admin-page-subtitle">
          Send push notifications to your users
        </p>
      </div>

      <div className="admin-grid admin-grid-2">
        {/* Templates */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Notification Templates</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notificationTemplates.map((template) => (
                <button
                  key={template.id}
                  style={{
                    padding: '16px',
                    background: selectedTemplate?.id === template.id ? 'rgba(14, 165, 233, 0.1)' : 'var(--admin-bg-tertiary)',
                    border: selectedTemplate?.id === template.id ? '1px solid var(--admin-accent)' : '1px solid transparent',
                    borderRadius: 'var(--admin-radius-sm)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setCustomTitle(template.title);
                    setCustomBody(template.body);
                    setCustomTarget(template.target);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)' }}>
                      {template.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--admin-text)' }}>{template.name}</div>
                      <span className="admin-badge" style={{ fontSize: '10px', padding: '2px 6px', background: getTargetColor(template.target), color: 'white' }}>
                        {template.target}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: '500' }}>{template.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>{template.body}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compose */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Compose Notification</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Target Audience
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['all', 'premium', 'free', 'inactive'] as const).map((target) => (
                  <button
                    key={target}
                    className={`admin-btn ${customTarget === target ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}
                    onClick={() => setCustomTarget(target)}
                  >
                    {target === 'all' && <Users size={14} />}
                    {target === 'premium' && <Crown size={14} />}
                    {target === 'free' && <Fish size={14} />}
                    {target === 'inactive' && <Clock size={14} />}
                    {target.charAt(0).toUpperCase() + target.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Title
              </label>
              <input
                type="text"
                className="admin-input"
                placeholder="Notification title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--admin-text-secondary)' }}>
                Body
              </label>
              <textarea
                className="admin-input"
                rows={4}
                placeholder="Notification message..."
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            {/* Preview */}
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '12px' }}>Preview</div>
              <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--admin-bg)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--admin-gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🎣
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '14px' }}>
                    {customTitle || 'Notification title'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
                    {customBody || 'Notification body message...'}
                  </div>
                </div>
              </div>
            </div>

            <button
              className="admin-btn admin-btn-primary"
              style={{ width: '100%' }}
              onClick={handleSendNotification}
              disabled={!customTitle || !customBody}
            >
              <Send size={16} />
              Send Notification
            </button>
          </div>
        </div>
      </div>

      {/* Performance Stats (Placeholder) */}
      <div className="admin-card" style={{ marginTop: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Notification Performance</h3>
        </div>
        <div className="admin-card-body">
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>Connect a push notification service (OneSignal, Firebase, etc.) to track delivery and engagement metrics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTargetColor(target: string): string {
  switch (target) {
    case 'all': return 'var(--admin-accent)';
    case 'premium': return '#f59e0b';
    case 'free': return '#a855f7';
    case 'inactive': return '#ef4444';
    default: return 'var(--admin-accent)';
  }
}

