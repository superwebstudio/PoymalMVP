"use client";

import React, { useState, useEffect } from 'react';
import { Settings, X, Globe, Shield, Star, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/useI18n';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface ProfileSettingsProps {
  currentLanguage: string;
  isPro: boolean;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentLanguage, isPro }) => {
  const { dict } = useI18n();
  const router = useRouter();
  const { userId, clearUser } = useUserStore();
  const { addNotification } = useNotificationStore();
  const { preferences, updatePreference, fetchPreferences, loading: loadingPreferences } = usePreferencesStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch preferences on mount
  useEffect(() => {
    if (userId && isOpen) {
      fetchPreferences(userId);
    }
  }, [userId, isOpen, fetchPreferences]);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete account');

      clearUser();
      setIsOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Delete account error:', error);
      addNotification({
        message: (dict as any).deleteFailed || 'Failed to delete account',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
      >
        <Settings size={24} className="text-zinc-400" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 w-full max-w-md rounded-2xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-10 fade-in border border-zinc-800">

            <div className="p-4 flex justify-between items-center border-b border-zinc-800">
              <h3 className="font-semibold text-lg text-zinc-100">Settings</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pb-24">
              {/* Language Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Globe className="text-blue-500" size={20} />
                  <span className="text-zinc-200">{dict.language || 'Language'}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <button className={cn("px-2 py-1 rounded transition-colors", currentLanguage === 'ru' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300")}>RU</button>
                  <button className={cn("px-2 py-1 rounded transition-colors", currentLanguage === 'en' ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300")}>EN</button>
                </div>
              </div>

              {/* Show Telegram Handle Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Shield className="text-blue-500" size={20} />
                  <span className="text-zinc-200">{dict.showTelegramHandle || 'Show Telegram Handle'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences?.showTelegramHandle ?? true}
                    disabled={loadingPreferences}
                    onChange={(e) => updatePreference('showTelegramHandle', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Show Country Badge Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Globe className="text-green-500" size={20} />
                  <span className="text-zinc-200">{dict.showCountryBadge || 'Show Country Badge'}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences?.showCountryBadge ?? true}
                    disabled={loadingPreferences}
                    onChange={(e) => updatePreference('showCountryBadge', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Shield className="text-green-500" size={20} />
                  <span className="text-zinc-200">{dict.hideLocation || 'Hide Location'}</span>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-700">
                  <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-zinc-400 transition" />
                </div>
              </div>

              {/* Pro Status */}
              <div className="p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="text-yellow-500 fill-yellow-500" size={20} />
                  <h4 className="font-bold text-yellow-500">Ulov PRO</h4>
                </div>
                <p className="text-sm text-yellow-200/80 mb-3">
                  {isPro ? (dict.youArePro || "You are a PRO member!") : (dict.getProFeatures || "Get unlimited AI scans and remove ads.")}
                </p>
                {!isPro && (
                  <button className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg shadow-sm transition-colors">
                    {dict.upgradeToPro || 'Upgrade to PRO'}
                  </button>
                )}
              </div>

              {/* Danger Zone */}
              <div className="space-y-2 pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-2">
                  {(dict as any).dangerZone || 'Danger Zone'}
                </h3>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-between bg-zinc-900 border border-red-900/50 hover:border-red-700 text-red-400 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 size={20} />
                    <span>{(dict as any).deleteAccount || 'Delete Account'}</span>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 w-full max-w-md rounded-2xl overflow-hidden shadow-xl border border-zinc-800">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {(dict as any).confirmDeleteAccount || 'Delete Account'}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {(dict as any).deleteAccountWarning || 'Are you sure you want to delete your account? This action cannot be undone.'}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (dict.loading || 'Deleting...') : ((dict as any).deleteAccount || 'Delete Account')}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {dict.cancel || 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
