"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Fish,
  Eye,
  EyeOff,
  MessageSquare,
  MoreVertical,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  X,
  AlertTriangle,
} from "lucide-react";

interface Catch {
  id: string;
  userId: string;
  imageUrl: string | null;
  species: string | null;
  description: string | null;
  weight: number | null;
  length: number | null;
  location: string | null;
  isPublic: boolean;
  isTextOnly: boolean;
  createdAt: Date;
  user: {
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
  };
  likesCount: number;
  commentsCount: number;
}

interface CatchesClientProps {
  data: {
    catches: Catch[];
    stats: {
      total: number;
      public: number;
      private: number;
      textOnly: number;
    };
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

export function CatchesClient({ data }: CatchesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get('filter') || 'all');
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionMenuCatch, setActionMenuCatch] = useState<string | null>(null);

  const { catches, stats, pagination } = data;

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
      router.push(`/admin/catches?${params.toString()}`);
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
      router.push(`/admin/catches?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    startTransition(() => {
      router.push(`/admin/catches?${params.toString()}`);
    });
  };

  const handleDeleteCatch = async () => {
    if (!selectedCatch) return;
    
    try {
      const response = await fetch(`/api/admin/catches/${selectedCatch.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedCatch(null);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete catch:', error);
    }
  };

  return (
    <div className="admin-animate-in">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Catches</h1>
        <p className="admin-page-subtitle">
          Manage {stats.total.toLocaleString()} catches
        </p>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-1)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--admin-accent)' }}>
              <Fish size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{stats.total.toLocaleString()}</div>
        </div>
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-2)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Public</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--admin-success)' }}>
              <Eye size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{stats.public.toLocaleString()}</div>
        </div>
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-3)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Private</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--admin-warning)' }}>
              <EyeOff size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{stats.private.toLocaleString()}</div>
        </div>
        <div className="admin-stat-card" style={{ '--stat-gradient': 'var(--admin-gradient-4)' } as React.CSSProperties}>
          <div className="admin-stat-header">
            <span className="admin-stat-label">Text Only</span>
            <div className="admin-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7' }}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="admin-stat-value">{stats.textOnly.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-body" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '250px' }}>
            <input
              type="text"
              className="admin-input admin-search-input"
              placeholder="Search by species, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'public', label: 'Public' },
              { key: 'private', label: 'Private' },
              { key: 'text', label: 'Text Only' },
            ].map((filter) => (
              <button
                key={filter.key}
                className={`admin-btn ${selectedFilter === filter.key ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}
                onClick={() => handleFilterChange(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catches Grid */}
      <div className="admin-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '24px' }}>
          {catches.map((catchItem) => (
            <div
              key={catchItem.id}
              style={{
                background: 'var(--admin-bg-tertiary)',
                borderRadius: 'var(--admin-radius)',
                overflow: 'hidden',
                border: '1px solid var(--admin-border)',
                opacity: isPending ? 0.5 : 1,
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', paddingTop: '75%', background: 'var(--admin-bg)' }}>
                {catchItem.imageUrl ? (
                  <img
                    src={catchItem.imageUrl}
                    alt={catchItem.species || 'Catch'}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)' }}>
                    {catchItem.isTextOnly ? <MessageSquare size={32} /> : <Fish size={32} />}
                  </div>
                )}
                
                {/* Visibility Badge */}
                <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                  <span className={`admin-badge ${catchItem.isPublic ? 'active' : 'warning'}`}>
                    {catchItem.isPublic ? <Eye size={12} /> : <EyeOff size={12} />}
                    {catchItem.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <button
                    className="admin-btn admin-btn-ghost"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setActionMenuCatch(actionMenuCatch === catchItem.id ? null : catchItem.id)}
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {actionMenuCatch === catchItem.id && (
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
                        marginTop: '4px',
                      }}
                    >
                      <button
                        className="admin-btn admin-btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0 }}
                        onClick={() => {
                          window.open(`/catch/${catchItem.id}`, '_blank');
                          setActionMenuCatch(null);
                        }}
                      >
                        <ExternalLink size={16} />
                        View Catch
                      </button>
                      <button
                        className="admin-btn admin-btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, color: 'var(--admin-danger)' }}
                        onClick={() => {
                          setSelectedCatch(catchItem);
                          setShowDeleteModal(true);
                          setActionMenuCatch(null);
                        }}
                      >
                        <Trash2 size={16} />
                        Delete Catch
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div className="admin-user-avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                    {catchItem.user.photoUrl ? (
                      <img src={catchItem.user.photoUrl} alt="" />
                    ) : (
                      catchItem.user.firstName?.[0] || '?'
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                    {catchItem.user.firstName || catchItem.user.username || 'Unknown'}
                  </span>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--admin-text)', marginBottom: '4px' }}>
                  {catchItem.species || 'Unknown species'}
                </h4>
                
                {catchItem.location && (
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                    <MapPin size={12} />
                    {catchItem.location}
                  </div>
                )}

                {catchItem.description && (
                  <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', marginBottom: '12px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {catchItem.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--admin-border)' }}>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                    <span><Heart size={14} style={{ display: 'inline', marginRight: '4px' }} />{catchItem.likesCount}</span>
                    <span><MessageSquare size={14} style={{ display: 'inline', marginRight: '4px' }} />{catchItem.commentsCount}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                    {formatRelativeTime(new Date(catchItem.createdAt))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {catches.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            No catches found
          </div>
        )}

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

      {/* Delete Modal */}
      {showDeleteModal && selectedCatch && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Delete Catch</h3>
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', padding: '12px', background: 'var(--admin-bg-tertiary)', borderRadius: 'var(--admin-radius-sm)' }}>
                {selectedCatch.imageUrl ? (
                  <img src={selectedCatch.imageUrl} alt="" style={{ width: '80px', height: '80px', borderRadius: 'var(--admin-radius-sm)', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: 'var(--admin-radius-sm)', background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Fish size={32} style={{ color: 'var(--admin-text-muted)' }} />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{selectedCatch.species || 'Unknown species'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                    by {selectedCatch.user.firstName || selectedCatch.user.username || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                    {selectedCatch.likesCount} likes · {selectedCatch.commentsCount} comments
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--admin-radius-sm)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} style={{ color: 'var(--admin-danger)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '13px', color: 'var(--admin-danger)' }}>
                  This action is permanent. The catch and all associated likes, comments, and reactions will be deleted.
                </span>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-danger" onClick={handleDeleteCatch}>
                <Trash2 size={16} />
                Delete Catch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

