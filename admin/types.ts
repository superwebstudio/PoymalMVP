// Admin Dashboard Types

export interface DashboardMetrics {
    // Growth
    totalUsers: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    newSignupsToday: number;
    newSignupsThisWeek: number;
    retention: {
        day1: number;
        day7: number;
        day30: number;
    };

    // Engagement
    totalCatches: number;
    catchesToday: number;
    catchesThisWeek: number;
    avgCatchesPerUser: number;
    usersWithAtLeastOneCatch: number;
    usersWithThreePlusCatches: number;
    activationRate: number;

    // Revenue
    totalPremiumUsers: number;
    freeUsers: number;
    premiumUsers: number;
    monthlyRecurringRevenue: number;
    conversionRate: number;
    averageRevenuePerUser: number;

    // Referrals
    totalReferralLinks: number;
    completedReferrals: number;
    referralConversionRate: number;
    premiumDaysGiven: number;
}

export interface UserSegments {
    deadUsers: number;
    casualUsers: number;
    regularUsers: number;
    powerUsers: number;
}

export interface RevenueMetrics {
    mrr: number;
    monthlySubs: number;
    annualSubs: number;
    churnRate: number;
    ltv: number;
    newPremiumThisMonth: number;
    cancellationsThisMonth: number;
    netGrowth: number;
    monthOverMonthGrowth: number;
}

export interface FunnelStep {
    label: string;
    count: number;
    percentage: number;
    dropOff?: number;
}

export interface AdminUser {
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
    lastActive: Date | null;
    totalCatches: number;
    totalReferrals: number;
    isBanned: boolean;
    bannedAt: Date | null;
    bannedReason: string | null;
}

export interface AdminCatch {
    id: string;
    userId: string;
    user: {
        firstName: string | null;
        username: string | null;
        photoUrl: string | null;
    };
    imageUrl: string | null;
    species: string | null;
    weight: number | null;
    length: number | null;
    location: string | null;
    isPublic: boolean;
    isTextOnly: boolean;
    createdAt: Date;
    likesCount: number;
    commentsCount: number;
    isFlagged: boolean;
    flagReason: string | null;
}

export interface RetentionData {
    date: string;
    day0: number;
    day1: number;
    day7: number;
    day30: number;
    day90: number;
}

export interface FeatureUsage {
    feature: string;
    usagePercent: number;
    isPremium: boolean;
    totalUses: number;
}

export interface NotificationPerformance {
    type: string;
    sent: number;
    delivered: number;
    opened: number;
    actionTaken: number;
    openRate: number;
    actionRate: number;
}

export interface TimeSeriesData {
    date: string;
    value: number;
}

export interface WeeklyReport {
    weekOf: string;
    growth: {
        newUsers: number;
        percentChange: number;
        dau: number;
        wau: number;
    };
    engagement: {
        catchesPosted: number;
        activeUsersWhoPosted: number;
        avgCatchesPerUser: number;
    };
    revenue: {
        mrr: number;
        mrrChange: number;
        newPremiumSubs: number;
        churnPercent: number;
        conversionRate: number;
    };
    referrals: {
        completed: number;
        cost: number;
        topReferrer: string;
        topReferrerCount: number;
    };
    issues: {
        deadUsersPercent: number;
        day7Retention: number;
        crashesThisWeek: number;
    };
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// User actions
export interface BanUserPayload {
    userId: string;
    reason: string;
    duration?: number; // days, undefined = permanent
}

export interface UserActionResult {
    success: boolean;
    message: string;
}

// Chart data types
export interface ChartDataPoint {
    name: string;
    value: number;
    fill?: string;
}

export interface LineChartData {
    date: string;
    [key: string]: string | number;
}

// Fraud detection
export interface FraudFlag {
    id: string;
    userId: string;
    type: 'multiple_referrals_same_ip' | 'no_gps_data' | 'rapid_posting' | 'duplicate_photo' | 'suspicious_email';
    description: string;
    severity: 'low' | 'medium' | 'high';
    createdAt: Date;
    resolved: boolean;
    resolvedAt: Date | null;
    resolvedBy: string | null;
}

