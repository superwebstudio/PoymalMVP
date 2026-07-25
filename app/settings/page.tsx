"use client";

import React, { useEffect, useState, useRef } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Globe, Info, User as UserIcon, Trash2, AlertTriangle, Bug, Bookmark, Heart, X, Image as ImageIcon, Bell, LogOut, MessageCircle } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useI18n } from '@/lib/useI18n';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SwipeablePage } from '@/components/SwipeablePage';
import ProfilePageClient from '@/app/profile/page.client';
import { useUserStore } from '@/stores/useUserStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { Modal } from '@/components/Modal';
import { CountrySearch } from '@/components/CountrySearch';
import { ALL_COUNTRIES } from '@/data/countries';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useImageCompression } from '@/hooks/useImageCompression';
import { useNotificationStore } from '@/stores/useNotificationStore';

export default function SettingsPage() {
  const { dict, mounted, lang } = useI18n();
  const router = useRouter();
  const { userId, clearUser, currentUser } = useUserStore();
  const { selectedLanguage } = useLanguageStore();
  const { addNotification } = useNotificationStore();
  const preferences = usePreferencesStore((state) => state.preferences);
  const loadingPreferences = usePreferencesStore((state) => state.loading);
  const updatePreference = usePreferencesStore((state) => state.updatePreference);
  const fetchPreferences = usePreferencesStore((state) => state.fetchPreferences);

  // Fetch preferences on mount
  useEffect(() => {
    if (userId) {
      fetchPreferences(userId).catch(console.error);
    }
  }, [userId, fetchPreferences]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [showThanksModal, setShowThanksModal] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugImages, setBugImages] = useState<File[]>([]);
  const [bugImagePreviews, setBugImagePreviews] = useState<string[]>([]);
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);
  const { compressImage } = useImageCompression();
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { scrollY } = useScroll();

  // Hide/show bottom nav on scroll - MUST be called before any conditional returns
  useMotionValueEvent(scrollY, "change", (latest) => {
    const current = latest;
    const previous = lastScrollY.current;

    if (current > previous && current > 100) {
      // Scrolling down
      setBottomNavVisible(false);
    } else if (current < previous) {
      // Scrolling up
      setBottomNavVisible(true);
    }

    lastScrollY.current = current;
  });

  if (!mounted) return null;

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 text-zinc-400">
        <Link
          href="/login?next=/settings"
          className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-500"
        >
          Sign in to open settings
        </Link>
      </div>
    );
  }

  const handleSignOut = async (): Promise<void> => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    clearUser();
    router.replace('/login');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete account');

      clearUser();
      router.push('/');
    } catch (error) {
      console.error('Delete account error:', error);
      addNotification({
        message: (dict as any).deleteFailed || 'Failed to delete account',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Limit to 3 images max
    const remainingSlots = 3 - bugImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    try {
      const compressedFiles: File[] = [];
      const previews: string[] = [];

      for (const file of filesToAdd) {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
        compressedFiles.push(compressedFile);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === filesToAdd.length) {
            setBugImagePreviews([...bugImagePreviews, ...previews]);
          }
        };
        reader.readAsDataURL(compressedFile);
      }

      setBugImages([...bugImages, ...compressedFiles]);
    } catch (error) {
      console.error('Image compression failed', error);
      // Fallback: use original files
      const previews: string[] = [];
      filesToAdd.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === filesToAdd.length) {
            setBugImagePreviews([...bugImagePreviews, ...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
      setBugImages([...bugImages, ...filesToAdd]);
    }
  };

  const removeImage = (index: number) => {
    setBugImages(bugImages.filter((_, i) => i !== index));
    setBugImagePreviews(bugImagePreviews.filter((_, i) => i !== index));
  };

  const handleReportBug = async () => {
    if (!bugDescription.trim()) {
      addNotification({
        message: dict.reportABugDescription || 'Please describe the bug',
        type: 'info',
        position: 'center',
        showOkButton: true,
      });
      return;
    }

    setIsSubmittingBug(true);
    try {
      const formData = new FormData();
      formData.append('description', bugDescription);
      formData.append('deviceInfo', navigator.userAgent);
      formData.append('appVersion', '1.0.0');

      // Add images
      bugImages.forEach((image, index) => {
        formData.append(`image${index}`, image);
      });

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to submit bug report');

      // Show thanks modal
      setShowBugReportModal(false);
      setShowThanksModal(true);
      setBugDescription('');
      setBugImages([]);
      setBugImagePreviews([]);
    } catch (error) {
      console.error('Bug report error:', error);
      addNotification({
        message: dict.reportABugError || 'Failed to submit bug report. Please try again.',
        type: 'error',
        position: 'center',
        showOkButton: true,
      });
    } finally {
      setIsSubmittingBug(false);
    }
  };

  return (
    <SwipeablePage
      previousPageComponent={<ProfilePageClient initialUser={null} />}
      onSwipeComplete={() => router.push('/profile')}
    >
      <TelegramBackButton fallbackUrl="/profile" />
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-30 flex items-center gap-3">
        <h1 className="text-xl font-bold text-zinc-200">{dict.settings}</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Account Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-2">{dict.account}</h3>

          {currentUser?.isPro ? (
            <Link href="/membership" className="flex items-center justify-between bg-zinc-900 border border-amber-500/30 rounded-lg p-4 hover:border-amber-500/50 transition-colors">
              <div className="flex items-center gap-3">
                <img src="/logo-min-gold.svg" alt="Ulov" className="h-5 w-5" />
                <div>
                  <div className="text-zinc-200 font-semibold">{dict.managePro || 'Manage PRO'}</div>
                  <div className="text-xs text-zinc-400">{dict.membershipManagement}</div>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/pro" className="flex items-center justify-between bg-zinc-900 border border-amber-500/30 rounded-lg p-4 hover:border-amber-500/50 transition-colors">
              <div className="flex items-center gap-3">
                <img src="/logo-min-gold.svg" alt="Ulov" className="h-5 w-5" />
                <div>
                  <div className="text-zinc-200 font-semibold">{dict.upgradeToPro}</div>
                  <div className="text-xs text-zinc-400">{dict.unlimitedAiAdFree}</div>
                </div>
              </div>
            </Link>
          )}

          <Link href="/saved" className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3">
              <Bookmark className="text-zinc-400" size={20} />
              <span className="text-zinc-200">{dict.savedPosts || 'Saved Posts'}</span>
            </div>
          </Link>

          <Link href="/liked" className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-3">
              <Heart className="text-zinc-400" size={20} />
              <span className="text-zinc-200">{dict.likedPosts || 'Liked Posts'}</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-zinc-200 transition-colors hover:border-zinc-700"
          >
            <span className="flex items-center gap-3">
              <LogOut className="text-zinc-400" size={20} />
              Sign out
            </span>
          </button>
        </div>

        {/* Preferences Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-2">{dict.preferences}</h3>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="text-zinc-400" size={20} />
                <span className="text-zinc-200">{dict.language}</span>
              </div>
              <LanguageToggle currentLanguage={selectedLanguage || 'ru'} userId={userId} />
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-2">{dict.privacy}</h3>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <UserIcon className="text-zinc-400" size={20} />
                <span className="text-zinc-200">{dict.showTelegramHandle}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.showTelegramHandle !== undefined ? preferences.showTelegramHandle : true}
                  disabled={loadingPreferences}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newValue = e.target.checked;
                    updatePreference('showTelegramHandle', newValue).catch(console.error);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Globe className="text-zinc-400" size={20} />
                <span className="text-zinc-200">{dict.showCountryBadge || 'Show Country Badge'}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.showCountryBadge !== undefined ? preferences.showCountryBadge : true}
                  disabled={loadingPreferences}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newValue = e.target.checked;
                    updatePreference('showCountryBadge', newValue).catch(console.error);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-2">
            {dict.notifications || 'Notifications'}
          </h3>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="text-zinc-400" size={20} />
                <div>
                  <span className="block text-zinc-200">
                    {dict.enableNotifications || 'Enable notifications'}
                  </span>
                  <span className="block text-xs text-zinc-500 mt-0.5">
                    {dict.enableNotificationsHint || 'Show alerts when someone interacts with your posts'}
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={preferences?.notificationsEnabled !== undefined ? preferences.notificationsEnabled : true}
                  disabled={loadingPreferences}
                  onChange={(e) => {
                    e.stopPropagation();
                    updatePreference('notificationsEnabled', e.target.checked).catch(console.error);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className={`flex items-center justify-between p-4 ${!(preferences?.notificationsEnabled ?? true) ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <Heart className="text-zinc-400" size={20} />
                <span className="text-zinc-200">{dict.notifyOnLikes || 'Likes'}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.notifyOnLikes !== undefined ? preferences.notifyOnLikes : true}
                  disabled={loadingPreferences || !(preferences?.notificationsEnabled ?? true)}
                  onChange={(e) => {
                    e.stopPropagation();
                    updatePreference('notifyOnLikes', e.target.checked).catch(console.error);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-60"></div>
              </label>
            </div>

            <div className={`flex items-center justify-between p-4 ${!(preferences?.notificationsEnabled ?? true) ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <MessageCircle className="text-zinc-400" size={20} />
                <span className="text-zinc-200">{dict.notifyOnComments || 'Comments'}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.notifyOnComments !== undefined ? preferences.notifyOnComments : true}
                  disabled={loadingPreferences || !(preferences?.notificationsEnabled ?? true)}
                  onChange={(e) => {
                    e.stopPropagation();
                    updatePreference('notifyOnComments', e.target.checked).catch(console.error);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-60"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">{dict.location}</h3>
            {preferences?.country && (() => {
              const selectedCountry = ALL_COUNTRIES.find(c => c.code === preferences.country);
              return selectedCountry ? (
                <span className="text-sm text-zinc-400 flex items-center gap-1">
                  <span>{selectedCountry.flag}</span>
                  <span>{lang === 'ru' ? selectedCountry.nameRu : selectedCountry.name}</span>
                </span>
              ) : null;
            })()}
          </div>

          <CountrySearch
            value={preferences?.country || null}
            onChange={(code) => updatePreference('country', code)}
            disabled={loadingPreferences}
          />
        </div>

        {/* Report Bug */}
        <button
          onClick={() => setShowBugReportModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 font-medium transition-colors"
        >
          <Bug size={18} />
          <span>{dict.reportABugButton}</span>
        </button>

        {/* About Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-2">{dict.about}</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3 text-zinc-400">
              <Info size={20} />
              <div>
                <div className="text-zinc-200 font-medium">Ulov v1.0.0</div>
                <div className="text-xs text-zinc-500">{dict.fishingLogbook}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-2">{(dict as any).dangerZone || 'Danger Zone'}</h3>
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

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={(dict as any).confirmDeleteAccount || 'Delete Account'}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <p className="text-zinc-400 text-sm">
            {(dict as any).deleteAccountWarning || 'Are you sure you want to delete your account? This action cannot be undone.'}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? ((dict as any).deleting || 'Deleting...') : ((dict as any).yesDelete || 'Yes, Delete Account')}
          </button>
          <button
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {dict.cancel || 'Cancel'}
          </button>
        </div>
      </Modal>

      {/* Bug Report Modal */}
      <Modal
        isOpen={showBugReportModal}
        onClose={() => {
          setShowBugReportModal(false);
          setBugDescription('');
          setBugImages([]);
          setBugImagePreviews([]);
        }}
        title={dict.reportABug || 'Report a Bug'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {dict.description || 'Description'}
            </label>
            <textarea
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder={dict.reportABugDescription || 'Please describe the bug you encountered...'}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 placeholder-zinc-400 focus:outline-none resize-none"
              rows={6}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {(dict as any).attachImages || 'Attach Images'} ({bugImages.length}/3)
            </label>
            {bugImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {bugImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Bug image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-zinc-700"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {bugImages.length < 3 && (
              <label className="flex items-center justify-center gap-2 w-full bg-zinc-800 border border-zinc-700 border-dashed rounded-lg px-4 py-3 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 cursor-pointer transition-colors">
                <ImageIcon size={18} />
                <span className="text-sm">{(dict as any).addImage || 'Add Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={handleReportBug}
              disabled={isSubmittingBug || !bugDescription.trim()}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingBug ? (dict.submitting || 'Submitting...') : (dict.submit || 'Submit')}
            </button>
            <button
              onClick={() => {
                setShowBugReportModal(false);
                setBugDescription('');
                setBugImages([]);
                setBugImagePreviews([]);
              }}
              disabled={isSubmittingBug}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {dict.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Thanks Modal */}
      <Modal
        isOpen={showThanksModal}
        onClose={() => setShowThanksModal(false)}
        title=""
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-zinc-200 mb-2">
            {(dict as any).thankYou || 'Thank You!'}
          </h3>
          <p className="text-zinc-400 text-sm mb-6">
            {(dict as any).weAppreciateIt || 'We appreciate your feedback and will look into this issue.'}
          </p>
          <button
            onClick={() => setShowThanksModal(false)}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {(dict as any).gotIt || 'Got it'}
          </button>
        </div>
      </Modal>

      <motion.div
        initial={{ y: 0 }}
        animate={{ y: bottomNavVisible ? 0 : 100 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <BottomNav />
      </motion.div>
    </SwipeablePage>
  );
}
