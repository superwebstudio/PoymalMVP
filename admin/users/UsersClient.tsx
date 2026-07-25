"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Crown,
  MoreVertical,
  Ban,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";

interface User {
  id: string;
  authId: string;
  email: string | null;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  isPro: boolean;
  proType: string | null;
  proExpiresAt: Date | null;
  country: string | null;
  language: string;
  createdAt: Date;
  lastActive: Date;
  totalCatches: number;
  totalFollowers: number;
  totalFollowing: number;
  totalReferrals: number;
}

interface UsersClientProps {
  data: {
    users: User[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

export function UsersClient({ data }: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get('filter') || 'all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);

  const { users, pagination } = data;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    const params = new URLSearchParams(searchParams);
    if (filter !== 'all') {
      params.set('filter', filter);
    } else {
      params.delete('filter');
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: banReason,
        }),
      });

      if (response.ok) {
        setShowBanModal(false);
        setSelectedUser(null);
        setBanReason('');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Users</h1>
        <p className="admin-page-subtitle">
          Manage {pagination.totalCount.toLocaleString()} registered users
        </p>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-body" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '250px' }}>
            <input
              type="text"
              className="admin-input admin-search-input"
              placeholder="Search by name, username, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pro', 'free'].map((filter) => (
              <button
                key={filter}
                className={`admin-btn ${selectedFilter === filter ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}
                onClick={() => handleFilterChange(filter)}
              >
                {filter === 'all' && 'All Users'}
                {filter === 'pro' && '👑 Pro'}
                {filter === 'free' && 'Free'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Catches</th>
                <th>Followers</th>
                <th>Referrals</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ opacity: isPending ? 0.5 : 1 }}>
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
                        <span className="admin-user-name">
                          {user.firstName || 'Unknown'}
                          {user.country && ` ${getCountryFlag(user.country)}`}
                        </span>
                        <span className="admin-user-username">
                          {user.username ? `@${user.username}` : 'No username'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {user.isPro ? (
                      <span className="admin-badge pro">
                        <Crown size={12} />
                        {user.proType === 'yearly' ? 'Annual' : 'Monthly'}
                      </span>
                    ) : (
                      <span className="admin-badge free">Free</span>
                    )}
                  </td>
                  <td>{user.totalCatches}</td>
                  <td>{user.totalFollowers}</td>
                  <td>{user.totalReferrals}</td>
                  <td>{formatDate(new Date(user.createdAt))}</td>
                  <td>
                    <span style={{ color: isRecentlyActive(new Date(user.lastActive)) ? 'var(--admin-success)' : 'var(--admin-text-muted)' }}>
                      {formatRelativeTime(new Date(user.lastActive))}
                    </span>
                  </td>
                  <td>
                    <div style={{ position: 'relative' }}>
                      <button
                        className="admin-btn admin-btn-ghost"
                        onClick={() => setActionMenuUser(actionMenuUser === user.id ? null : user.id)}
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {actionMenuUser === user.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            background: 'var(--admin-bg-secondary)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: 'var(--admin-radius-sm)',
                            minWidth: '160px',
                            zIndex: 10,
                            boxShadow: 'var(--admin-shadow-lg)',
                          }}
                        >
                          <button
                            className="admin-btn admin-btn-ghost"
                            style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0 }}
                            onClick={() => {
                              router.push(`/user/${user.id}`);
                              setActionMenuUser(null);
                            }}
                          >
                            <Eye size={16} />
                            View Profile
                          </button>
                          <button
                            className="admin-btn admin-btn-ghost"
                            style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, color: 'var(--admin-warning)' }}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBanModal(true);
                              setActionMenuUser(null);
                            }}
                          >
                            <Ban size={16} />
                            Ban User
                          </button>
                          <button
                            className="admin-btn admin-btn-ghost"
                            style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, color: 'var(--admin-danger)' }}
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                              setActionMenuUser(null);
                            }}
                          >
                            <Trash2 size={16} />
                            Delete User
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--admin-text-muted)', fontSize: '14px' }}>
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount}
          </span>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Ban User</h3>
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowBanModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
                <div className="admin-user-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                  {selectedUser.photoUrl ? (
                    <img src={selectedUser.photoUrl} alt="" />
                  ) : (
                    selectedUser.firstName?.[0] || '?'
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{selectedUser.firstName}</div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>@{selectedUser.username}</div>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--admin-radius-sm)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} style={{ color: 'var(--admin-warning)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '13px', color: 'var(--admin-warning)' }}>
                  Banning this user will prevent them from logging in and hide their content from the feed.
                </span>
              </div>

              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--admin-text-secondary)' }}>
                Reason for ban
              </label>
              <textarea
                className="admin-input"
                rows={3}
                placeholder="Enter reason for banning this user..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowBanModal(false)}>
                Cancel
              </button>
              <button 
                className="admin-btn admin-btn-danger" 
                onClick={handleBanUser}
                disabled={!banReason.trim()}
              >
                <Ban size={16} />
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Delete User</h3>
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
                <div className="admin-user-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                  {selectedUser.photoUrl ? (
                    <img src={selectedUser.photoUrl} alt="" />
                  ) : (
                    selectedUser.firstName?.[0] || '?'
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{selectedUser.firstName}</div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>@{selectedUser.username}</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                    {selectedUser.totalCatches} catches · {selectedUser.totalFollowers} followers
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--admin-radius-sm)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} style={{ color: 'var(--admin-danger)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '13px', color: 'var(--admin-danger)' }}>
                  This action is permanent and cannot be undone. All user data, catches, comments, and follows will be permanently deleted.
                </span>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-danger" onClick={handleDeleteUser}>
                <Trash2 size={16} />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function isRecentlyActive(date: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  return diffDays < 7;
}

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

