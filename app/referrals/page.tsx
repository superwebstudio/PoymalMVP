"use client";

import React, { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { TelegramBackButton } from "@/components/TelegramBackButton";
import { useI18n } from "@/lib/useI18n";
import { useUserStore } from "@/stores/useUserStore";
import {
  Share2,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Trophy,
  Users,
  Ticket,
  ChevronRight,
  ChevronDown,
  X,
  Info,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  premiumDaysBalance: number;
  totalCompletedReferrals: number;
  raffleTickets: number;
  totalDaysEarned: number;
  stats: {
    completed: number;
    pending: number;
    expired: number;
  };
  referrals: Array<{
    id: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    firstPostAt: string | null;
    daysAwarded: number;
    user: {
      firstName: string | null;
      username: string | null;
      photoUrl: string | null;
    };
  }>;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  username: string | null;
  photoUrl: string | null;
  referrals: number;
  raffleTickets: number;
}

export default function ReferralsPage() {
  const { dict } = useI18n();
  const { userId } = useUserStore();
  const [data, setData] = useState<ReferralData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showLeaderboardSheet, setShowLeaderboardSheet] = useState(false);
  const [showRulesSheet, setShowRulesSheet] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        const [referralRes, leaderboardRes] = await Promise.all([
          fetch("/api/referral", { credentials: "include" }),
          fetch("/api/referral/leaderboard?limit=20"),
        ]);

        if (referralRes.ok) {
          setData(await referralRes.json());
        }
        if (leaderboardRes.ok) {
          const lb = await leaderboardRes.json();
          setLeaderboard(lb.leaderboard);
        }
      } catch (error) {
        console.error("Error fetching referral data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleCopy = async (): Promise<void> => {
    if (!data?.referralLink) return;

    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async (): Promise<void> => {
    if (!data?.referralLink) return;

    const shareText =
      dict.referralShareText ||
      "Join me on Poymal! When you post your first catch within 7 days, we both get 7 days of Premium.";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Join Poymal",
          text: shareText,
          url: data.referralLink,
        });
        return;
      } catch (error) {
        // AbortError = user dismissed the sheet; don't fall back to copy
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await handleCopy();
  };

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return dict.expired || "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  const completed = data?.totalCompletedReferrals || 0;
  const raffleTickets = data?.raffleTickets || 0;

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 text-white">
      <TelegramBackButton />

      <div className="px-4 py-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold">
            {dict.inviteFriends || "Invite Friends"}
          </h1>
          <button
            type="button"
            onClick={() => setShowRulesSheet(true)}
            className="rounded-full p-1.5 transition-colors hover:bg-zinc-800"
            title={dict.rules || "Rules"}
          >
            <Info size={18} className="text-zinc-400" />
          </button>
        </div>
        <p className="mx-auto max-w-sm text-sm text-zinc-400">
          {dict.referralOneBenefit ||
            "Invite a friend. When they post their first catch within 7 days, you both get 7 days of Premium."}
        </p>
      </div>

      <div className="space-y-6 px-4 pb-32">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm text-zinc-300">
              {data?.referralLink || "..."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
              copied ? "bg-green-600" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            {copied ? (
              <CheckCircle size={20} className="text-white" />
            ) : (
              <Copy size={20} className="text-zinc-300" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-sky-400">{completed}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {dict.successfulReferrals || "Successful invites"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              +{data?.totalDaysEarned || 0}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {dict.daysEarned || "Days earned"}
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex w-full items-center justify-between py-2"
          >
            <h3 className="text-sm font-semibold text-zinc-400">
              {dict.howItWorks || "How it works"}
            </h3>
            {showHowItWorks ? (
              <ChevronDown size={18} className="text-zinc-400" />
            ) : (
              <ChevronRight size={18} className="text-zinc-400" />
            )}
          </button>
          {showHowItWorks && (
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <div className="flex gap-2">
                <span className="flex-shrink-0 font-semibold text-sky-400">1.</span>
                <span>{dict.inviteFriend || "Invite a friend"}</span>
              </div>
              <div className="flex gap-2">
                <span className="flex-shrink-0 font-semibold text-sky-400">2.</span>
                <span>
                  {dict.friendPostsCatch ||
                    "They post their first catch within 7 days"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="flex-shrink-0 font-semibold text-sky-400">3.</span>
                <span>
                  {dict.bothGetSevenDays || "You both get 7 days of Premium"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800" />

        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Ticket size={18} className="text-amber-400" />
            <h2 className="text-base font-semibold text-amber-200">
              {dict.monthlyPrizeDraw || "Monthly Prize Draw"}
            </h2>
          </div>
          <p className="mb-4 text-sm text-zinc-400">
            {dict.monthlyPrizeDrawDesc ||
              "Every successful referral = 1 entry. Win fishing gear such as sonars, rods, or kayaks."}
          </p>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3">
            <span className="text-sm text-zinc-400">
              {dict.yourEntries || "Your entries"}
            </span>
            <span className="text-lg font-bold text-amber-300">{raffleTickets}</span>
          </div>
        </section>

        <div className="flex items-center justify-center gap-6 text-sm">
          <button
            type="button"
            onClick={() => setShowHistorySheet(true)}
            className="text-sky-400 underline hover:text-sky-300"
          >
            {dict.history || "History"}
          </button>
          <span className="text-zinc-700">•</span>
          <button
            type="button"
            onClick={() => setShowLeaderboardSheet(true)}
            className="text-sky-400 underline hover:text-sky-300"
          >
            {dict.leaderboard || "Top"}
          </button>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 py-4 font-bold text-white shadow-lg shadow-sky-900/30 transition-all hover:from-sky-500 hover:to-sky-400"
        >
          <Share2 size={20} />
          {dict.shareWithFriends || "Share with Friends"}
        </button>
      </div>

      <AnimatePresence>
        {showHistorySheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistorySheet(false)}
              className="fixed inset-0 z-[99] bg-black/60"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed bottom-0 left-0 right-0 z-[100] max-h-[80vh] overflow-hidden rounded-t-2xl border-t border-zinc-800 bg-zinc-900 pb-[max(80px,calc(80px+env(safe-area-inset-bottom)))]"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                <h3 className="text-lg font-semibold">{dict.history || "History"}</h3>
                <button
                  type="button"
                  onClick={() => setShowHistorySheet(false)}
                  className="rounded-full p-2 hover:bg-zinc-800"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>
              <div className="max-h-[calc(80vh-60px)] space-y-2 overflow-y-auto p-4">
                {!data?.referrals?.length ? (
                  <div className="py-12 text-center text-zinc-500">
                    <Users size={48} className="mx-auto mb-3 opacity-50" />
                    <p>{dict.noReferralsYet || "No referrals yet"}</p>
                    <p className="text-sm">
                      {dict.startInviting || "Start inviting friends!"}
                    </p>
                  </div>
                ) : (
                  data.referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 p-3"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-700">
                        {referral.user.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={referral.user.photoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-600">
                            <Users size={20} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {referral.user.firstName ||
                            referral.user.username ||
                            "Anonymous"}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          {referral.status === "completed" && (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle size={12} />
                              {dict.completed || "Completed"}
                            </span>
                          )}
                          {referral.status === "pending" && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <Clock size={12} />
                              {getTimeRemaining(referral.expiresAt)}{" "}
                              {dict.left || "left"}
                            </span>
                          )}
                          {referral.status === "expired" && (
                            <span className="flex items-center gap-1 text-red-400">
                              <XCircle size={12} />
                              {dict.expired || "Expired"}
                            </span>
                          )}
                        </div>
                      </div>
                      {referral.status === "completed" &&
                        referral.daysAwarded > 0 && (
                          <div className="text-right">
                            <p className="font-semibold text-green-400">
                              +{referral.daysAwarded}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {dict.days || "days"}
                            </p>
                          </div>
                        )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaderboardSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLeaderboardSheet(false)}
              className="fixed inset-0 z-[99] bg-black/60"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed bottom-0 left-0 right-0 z-[100] max-h-[80vh] overflow-hidden rounded-t-2xl border-t border-zinc-800 bg-zinc-900 pb-[max(80px,calc(80px+env(safe-area-inset-bottom)))]"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Trophy size={20} className="text-yellow-500" />
                  {dict.topAnglers || "Top Anglers"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLeaderboardSheet(false)}
                  className="rounded-full p-2 hover:bg-zinc-800"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>
              <div className="max-h-[calc(80vh-60px)] space-y-2 overflow-y-auto p-4">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-xl border bg-zinc-800 p-3 ${
                      entry.rank <= 3
                        ? "border-yellow-500/30"
                        : "border-zinc-700"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                        entry.rank === 1
                          ? "bg-yellow-500 text-black"
                          : entry.rank === 2
                            ? "bg-zinc-400 text-black"
                            : entry.rank === 3
                              ? "bg-orange-600 text-white"
                              : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {entry.rank}
                    </div>
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-zinc-700">
                      {entry.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.photoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                          <Users size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{entry.name}</p>
                      {entry.username && (
                        <p className="text-xs text-zinc-500">@{entry.username}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-semibold">{entry.referrals}</p>
                      <p className="text-xs text-zinc-500">
                        {dict.referrals || "referrals"}
                      </p>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="py-12 text-center text-zinc-500">
                    <Trophy size={48} className="mx-auto mb-3 opacity-50" />
                    <p>{dict.noLeaderboardData || "No leaderboard data yet"}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRulesSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRulesSheet(false)}
              className="fixed inset-0 z-[99] bg-black/60"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed bottom-0 left-0 right-0 z-[100] max-h-[85vh] overflow-hidden rounded-t-2xl border-t border-zinc-800 bg-zinc-900 pb-[max(80px,calc(80px+env(safe-area-inset-bottom)))]"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                <h3 className="text-lg font-semibold">
                  {dict.howItWorksTitle || "How the program works"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRulesSheet(false)}
                  className="rounded-full p-2 hover:bg-zinc-800"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>
              <div className="max-h-[calc(85vh-60px)] space-y-5 overflow-y-auto p-4">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                    {dict.referralProgram || "Referral programme"}
                  </h4>
                  <ul className="ml-1 space-y-1.5 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-sky-400">•</span>
                      <span>{dict.inviteFriend || "Invite a friend"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-sky-400">•</span>
                      <span>
                        {dict.friendPostsCatch ||
                          "They post their first catch within 7 days"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-sky-400">•</span>
                      <span>
                        {dict.bothGetSevenDays ||
                          "You both get 7 days of Premium"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                    {dict.monthlyPrizeDraw || "Monthly Prize Draw"}
                  </h4>
                  <p className="text-sm text-zinc-400">
                    {dict.monthlyPrizeDrawDesc ||
                      "Every successful referral = 1 entry. Win fishing gear such as sonars, rods, or kayaks."}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-400">
                    <span className="font-semibold text-zinc-300">
                      {dict.ifMisses || "If they miss"}:
                    </span>{" "}
                    {dict.noReward || "no reward"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRulesSheet(false)}
                  className="mt-2 w-full rounded-xl bg-sky-600 py-3 font-semibold text-white transition-colors hover:bg-sky-500"
                >
                  {dict.gotIt || "Got it"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
