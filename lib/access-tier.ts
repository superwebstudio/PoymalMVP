export type AccessTier = 'guest' | 'free' | 'pro';

export type AccessUser = {
  id?: string | null;
  isPro?: boolean | null;
} | null | undefined;

export function getAccessTier(user: AccessUser): AccessTier {
  if (!user?.id) return 'guest';
  if (user.isPro) return 'pro';
  return 'free';
}

export function canLogCatch(tier: AccessTier): boolean {
  return tier === 'free' || tier === 'pro';
}

export function canEngageSocial(tier: AccessTier): boolean {
  return tier === 'free' || tier === 'pro';
}

export function canFollowUsers(tier: AccessTier): boolean {
  return tier === 'free' || tier === 'pro';
}

export function canViewOwnExactCoords(tier: AccessTier): boolean {
  return tier === 'free' || tier === 'pro';
}

export function canViewCommunityExactCoords(tier: AccessTier): boolean {
  return tier === 'pro';
}

export function canUseAdvancedMapFilters(tier: AccessTier): boolean {
  return tier === 'pro';
}

export function canExportCatches(tier: AccessTier): boolean {
  return tier === 'pro';
}

export function canUseUnlimitedAi(tier: AccessTier): boolean {
  return tier === 'pro';
}

/** Round to ~2km grid so community points stay approximate for non-PRO. */
export function fuzzCoordinate(value: number): number {
  return Math.round(value * 50) / 50;
}
