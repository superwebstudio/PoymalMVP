import React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { CachedImage } from '@/components/CachedImage';
import { PostMenu } from '@/components/PostMenu';
import { useI18n } from '@/lib/useI18n';

interface CatchHeaderProps {
  catchData: any;
  isOwner: boolean;
  router: any;
}

export const CatchHeader: React.FC<CatchHeaderProps> = ({ catchData, isOwner, router }) => {
  const { dict } = useI18n();

  return (
    <div className="flex items-center justify-between">
      <Link href={`/user/${catchData.user.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1">
        <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden">
          {catchData.user.photoUrl ? (
            <CachedImage
              src={catchData.user.photoUrl}
              alt={catchData.user.username || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">?</div>
          )}
        </div>
        <div>
          <div className="font-semibold text-zinc-200 flex items-center gap-2">
            {catchData.user.firstName || catchData.user.username || dict.unknownAngler}
            {catchData.user.isPro && (
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">
                PRO
              </span>
            )}
          </div>
          <div className="text-sm text-zinc-500 flex items-center gap-1">
            <Calendar size={14} />
            {new Date(catchData.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
            <span className="ml-1">
              {new Date(catchData.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </Link>

      {isOwner && (
        <PostMenu
          catchId={catchData.id || ''}
          userId={catchData.userId}
          isPinned={(catchData as any).isPinned || false}
          onDeleteSuccess={() => router.push('/profile')}
        />
      )}
    </div>
  );
};


