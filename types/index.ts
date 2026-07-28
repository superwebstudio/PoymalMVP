export type Catch = {
    id: string;
    userId: string;
    imageUrl: string | null;
    species: string | null;
    description: string | null;
    weight: number | null;
    length: number | null;
    location: string | null;
    isPublic: boolean;
    latitude: number | null;
    longitude: number | null;
    isTextOnly?: boolean;
    depth: number | null;
    waterTemp: number | null;
    bait: string | null;
    method: string | null;
    locationPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        likes: number;
        comments?: number;
    };
    reactions?: Array<{
        userId: string;
        emoji: string;
    }>;
    isPinned?: boolean;
};

export type User = {
    id: string;
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
    isPro: boolean;
    language: string;
    proType: string | null;
    country: string | null;
    catches: Catch[];
    _count: {
        followers: number;
        following: number;
    };
    showCountryBadge?: boolean;
    catchViewMode?: string;
    proExpiresAt?: Date | string;
    proStartedAt?: Date | string | null;
    proCancelAtPeriodEnd?: boolean;
    stripeSubscriptionId?: string | null;
};

export type PlanType = 'monthly';
export type PaymentMethod = 'stripe';

// Re-export from countries data
export { ALL_COUNTRIES, getCountryByCode, getCountryFlag } from '@/data/countries';
export type { Country } from '@/data/countries';

// Legacy type for backward compatibility
export type CountryCode = string;

// Legacy COUNTRIES array for backward compatibility (deprecated, use ALL_COUNTRIES)
import { ALL_COUNTRIES as ALL_COUNTRIES_DATA, type Country as CountryType } from '@/data/countries';
export const COUNTRIES = ALL_COUNTRIES_DATA.slice(0, 7).map((c: CountryType) => ({
    code: c.code,
    emoji: c.flag,
    dictKey: c.code.toLowerCase() as any,
}));

