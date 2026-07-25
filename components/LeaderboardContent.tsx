"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Award, Fish, Calendar, Users, Globe, ArrowUpDown, X, Search, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/useI18n';
import { CachedImage } from '@/components/CachedImage';

type LeaderboardCategory = 'total' | 'species' | 'streak' | 'following' | 'country';

export const LeaderboardContent = () => {
  const { dict } = useI18n();
  const [category, setCategory] = useState<LeaderboardCategory>('total');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [showCountrySearch, setShowCountrySearch] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [userCountry, setUserCountry] = useState<string>('');

  // Get current user's country
  useEffect(() => {
    fetch('/api/user/current')
      .then(res => res.json())
      .then(data => {
        if (data?.country) {
          setUserCountry(data.country);
          if (category === 'country' && !selectedCountry) {
            setSelectedCountry(data.country);
          }
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = category === 'country' && selectedCountry
      ? `/api/leaderboard?category=${category}&country=${encodeURIComponent(selectedCountry)}`
      : `/api/leaderboard?category=${category}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array
        setLeaderboard(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLeaderboard([]);
        setLoading(false);
      });
  }, [category, selectedCountry]);

  const categories = [
    { id: 'total' as const, label: dict.totalWeight, icon: Trophy },
    { id: 'species' as const, label: dict.mostSpecies, icon: Fish },
    { id: 'streak' as const, label: dict.longestStreak, icon: Calendar },
    { id: 'following' as const, label: dict.followingOnly, icon: Users },
    { id: 'country' as const, label: dict.byCountry, icon: Globe, flag: '🌍' },
  ];

  const countries = [
    { value: 'Russia', label: dict.russia, flag: '🇷🇺' },
    { value: 'USA', label: dict.usa, flag: '🇺🇸' },
    { value: 'Canada', label: dict.canada, flag: '🇨🇦' },
    { value: 'UK', label: dict.uk, flag: '🇬🇧' },
    { value: 'Germany', label: dict.germany, flag: '🇩🇪' },
    { value: 'France', label: dict.france, flag: '🇫🇷' },
    { value: 'Other', label: dict.other, flag: '🌍' },
  ];

  const filteredCountries = countries.filter(c =>
    c.label.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  const handleCategorySelect = (cat: LeaderboardCategory) => {
    if (cat === 'country') {
      setShowCountrySearch(true);
    } else {
      setCategory(cat);
      setShowBottomSheet(false);
      setShowCountrySearch(false);
    }
  };

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setCategory('country');
    setShowCountrySearch(false);
    setShowBottomSheet(false);
  };

  const handleBackToCategories = () => {
    setShowCountrySearch(false);
    setCountrySearchQuery('');
  };

  const currentCategory = categories.find(c => c.id === category);
  const getCountryFlag = (countryValue: string) => {
    return countries.find(c => c.value === countryValue)?.flag || '🌍';
  };

  return (
    <div className="space-y-4">
      {/* Sort Button */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-zinc-200 flex items-center gap-2">
          {category === 'country' && selectedCountry ? (
            <>
              <span>{(dict as any).bestIn || 'Best in'}</span>
              <span className="text-xl">{getCountryFlag(selectedCountry)}</span>
              <span>{countries.find(c => c.value === selectedCountry)?.label || selectedCountry}</span>
            </>
          ) : (
            currentCategory?.label || dict.leaderboard
          )}
        </h2>
        <button
          onClick={() => setShowBottomSheet(true)}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
        >
          <ArrowUpDown className="text-zinc-400" size={20} />
        </button>
      </div>

      {/* Bottom Sheet with Framer Motion */}
      <AnimatePresence>
        {showBottomSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowBottomSheet(false);
                setShowCountrySearch(false);
              }}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] w-full bg-zinc-900 rounded-t-3xl border-t border-zinc-800 max-h-[80vh] overflow-y-auto"
              style={{ paddingBottom: 'max(60px, calc(60px + env(safe-area-inset-bottom)))' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
                <div className="p-4 flex items-center justify-between">
                  {showCountrySearch && (
                    <button
                      onClick={handleBackToCategories}
                      className="p-2 rounded-full hover:bg-zinc-800 transition-colors -ml-2"
                    >
                      <ArrowLeft className="text-zinc-400" size={20} />
                    </button>
                  )}
                  <h3 className="font-bold text-lg text-zinc-200 flex-1">
                    {showCountrySearch ? dict.selectCountry : dict.selectCategory}
                  </h3>
                  <button
                    onClick={() => {
                      setShowBottomSheet(false);
                      setShowCountrySearch(false);
                    }}
                    className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                  >
                    <X className="text-zinc-400" size={20} />
                  </button>
                </div>
                {/* Fixed search field when in country search mode */}
                {showCountrySearch && (
                  <div className="px-4 pb-4 border-b border-zinc-800">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input
                        type="text"
                        value={countrySearchQuery}
                        onChange={(e) => setCountrySearchQuery(e.target.value)}
                        placeholder={dict.selectCountry}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-1 pb-8">
                {!showCountrySearch ? (
                  <>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={cn(
                          "w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all",
                          category === cat.id
                            ? "bg-sky-500/10 text-sky-500"
                            : "text-zinc-300 hover:bg-zinc-800/50"
                        )}
                      >
                        <cat.icon size={20} className={category === cat.id ? "text-sky-500" : "text-zinc-400"} />
                        <span className="font-medium">{cat.label}</span>
                        {category === cat.id && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500" />
                        )}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="space-y-1">
                    <div className="space-y-1">
                      {/* Show user's country first if available */}
                      {userCountry && (
                        <button
                          onClick={() => handleCountrySelect(userCountry)}
                          className={cn(
                            "w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all text-left",
                            selectedCountry === userCountry
                              ? "bg-sky-500/10 text-sky-500"
                              : "text-zinc-300 hover:bg-zinc-800/50"
                          )}
                        >
                          <span className="text-xl">{getCountryFlag(userCountry)}</span>
                          <div className="flex-1">
                            <span className="font-medium">{countries.find(c => c.value === userCountry)?.label || userCountry}</span>
                            <div className="text-xs text-zinc-500">{dict.yourCountry}</div>
                          </div>
                          {selectedCountry === userCountry && (
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          )}
                        </button>
                      )}
                      {filteredCountries
                        .filter(c => !userCountry || c.value !== userCountry)
                        .map((country) => (
                          <button
                            key={country.value}
                            onClick={() => handleCountrySelect(country.value)}
                            className={cn(
                              "w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all text-left",
                              selectedCountry === country.value
                                ? "bg-sky-500/10 text-sky-500"
                                : "text-zinc-300 hover:bg-zinc-800/50"
                            )}
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="font-medium">{country.label}</span>
                            {selectedCountry === country.value && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500" />
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-10 text-zinc-500">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          {dict.loading}...
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-2 mb-6 px-4">
              {/* 2nd Place */}
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: 'spring',
                  damping: 25,
                  stiffness: 200,
                  delay: 0.15
                }}
                className="flex-1"
              >
                <Link href={`/user/${leaderboard[1].id}`} className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-400 mb-2">
                    {leaderboard[1].photoUrl ? (
                      <CachedImage src={leaderboard[1].photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xl">2</div>
                    )}
                  </div>
                  <Medal className="text-zinc-400 mb-1" size={18} />
                  <div className="text-xs text-zinc-400 text-center truncate w-full">
                    {leaderboard[1].firstName || leaderboard[1].username}
                  </div>
                  <div className="text-sm font-bold text-zinc-200">{leaderboard[1].score}</div>
                  <div className="bg-zinc-800 h-16 w-full rounded-t-lg mt-2 border-t-2 border-zinc-400"></div>
                </Link>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 180,
                  delay: 0
                }}
                className="flex-1"
              >
                <Link href={`/user/${leaderboard[0].id}`} className="flex flex-col items-center">
                  <div className="w-18 h-18 rounded-full bg-zinc-800 overflow-hidden border-4 border-yellow-400 mb-2">
                    {leaderboard[0].photoUrl ? (
                      <CachedImage src={leaderboard[0].photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-2xl">1</div>
                    )}
                  </div>
                  <Trophy className="text-yellow-400 mb-1" size={22} />
                  <div className="text-xs text-zinc-200 text-center truncate w-full font-semibold">
                    {leaderboard[0].firstName || leaderboard[0].username}
                  </div>
                  <div className="text-lg font-bold text-yellow-400">{leaderboard[0].score}</div>
                  <div className="bg-gradient-to-t from-yellow-900/30 to-yellow-700/30 h-24 w-full rounded-t-lg mt-2 border-t-4 border-yellow-400"></div>
                </Link>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ y: 90, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  type: 'spring',
                  damping: 28,
                  stiffness: 220,
                  delay: 0.25
                }}
                className="flex-1"
              >
                <Link href={`/user/${leaderboard[2].id}`} className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 overflow-hidden border-2 border-orange-600 mb-2">
                    {leaderboard[2].photoUrl ? (
                      <CachedImage src={leaderboard[2].photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xl">3</div>
                    )}
                  </div>
                  <Award className="text-orange-600 mb-1" size={18} />
                  <div className="text-xs text-zinc-400 text-center truncate w-full">
                    {leaderboard[2].firstName || leaderboard[2].username}
                  </div>
                  <div className="text-sm font-bold text-zinc-200">{leaderboard[2].score}</div>
                  <div className="bg-zinc-800 h-12 w-full rounded-t-lg mt-2 border-t-2 border-orange-600"></div>
                </Link>
              </motion.div>
            </div>
          )}

          {/* Rest of Leaderboard */}
          <div className="space-y-2">
            {leaderboard.slice(3).map((user, index) => {
              const rank = index + 4;
              return (
                <motion.div
                  key={user.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    damping: 30,
                    stiffness: 250,
                    delay: 0.35 + (index * 0.05)
                  }}
                >
                  <Link
                    href={`/user/${user.id}`}
                    className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="w-8 text-center font-bold text-zinc-500">
                      #{rank}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                      {user.photoUrl ? (
                        <CachedImage src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">{rank}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-zinc-200 truncate flex items-center gap-2">
                        {user.firstName || user.username || 'Angler'}
                        {user.isPro && (
                          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">
                            PRO
                          </span>
                        )}
                      </div>
                      {user.country && (
                        <div className="text-xs text-zinc-500">{user.country}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-zinc-200">{user.score}</div>
                      <div className="text-xs text-zinc-500">{getCategoryLabel(category, dict)}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-10 text-zinc-600">
              <p>{dict.noResults || 'No results'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function getCategoryLabel(category: LeaderboardCategory, dict: any): string {
  switch (category) {
    case 'total': return dict.kg;
    case 'species': return dict.species;
    case 'streak': return dict.days;
    case 'following': return dict.kg;
    case 'country': return dict.kg;
    default: return '';
  }
}