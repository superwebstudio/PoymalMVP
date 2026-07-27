import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createCatchSchema, validateBody, formatZodError } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse, CREATE_CATCH_LIMIT, addRateLimitHeaders } from '@/lib/rate-limit';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export const dynamic = 'force-dynamic';

const REFERRAL_PREMIUM_DAYS = 7;

function bustFeedCache(): void {
    revalidateTag('feed', 'max');
    revalidatePath('/');
}

// Helper function to process referral rewards
async function processReferralReward(userId: string): Promise<{ referredUserDays: number; referrerDays: number } | null> {
    try {
        // Check if user has any previous non-text-only catches
        const previousCatches = await prisma.catch.count({
            where: {
                userId,
                isTextOnly: false,
            },
        });

        // Only process if this is their first real catch
        if (previousCatches > 0) {
            return null;
        }

        // Find pending referral for this user
        const referral = await prisma.referral.findUnique({
            where: { referredUserId: userId },
        });

        if (!referral || referral.status !== 'pending') {
            return null;
        }

        // Check if within 7 day window
        if (new Date() > referral.expiresAt) {
            await prisma.referral.update({
                where: { id: referral.id },
                data: { status: 'expired' },
            });
            return null;
        }

        const referrer = await prisma.user.findUnique({
            where: { id: referral.referrerUserId },
            select: { totalCompletedReferrals: true },
        });

        if (!referrer) return null;

        await prisma.referral.update({
            where: { id: referral.id },
            data: {
                status: 'completed',
                firstPostAt: new Date(),
                rewardClaimed: true,
                daysAwarded: REFERRAL_PREMIUM_DAYS,
            },
        });

        // Referrer: 7 Premium days + 1 prize-draw entry
        await prisma.user.update({
            where: { id: referral.referrerUserId },
            data: {
                totalCompletedReferrals: { increment: 1 },
                premiumDaysBalance: { increment: REFERRAL_PREMIUM_DAYS },
                raffleTickets: { increment: 1 },
            },
        });

        const referredUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { proExpiresAt: true, firstName: true, username: true },
        });

        const now = new Date();
        const currentExpiry =
            referredUser?.proExpiresAt && referredUser.proExpiresAt > now
                ? referredUser.proExpiresAt
                : now;
        const newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + REFERRAL_PREMIUM_DAYS);

        await prisma.user.update({
            where: { id: userId },
            data: {
                isPro: true,
                proExpiresAt: newExpiry,
                proType: 'referral',
            },
        });

        const referredUserName = referredUser?.firstName || referredUser?.username || 'Друг';

        await prisma.notification.create({
            data: {
                userId: referral.referrerUserId,
                type: 'referral_completed',
                actorId: userId,
                content: `🎉 ${referredUserName} поймал свою первую рыбу!\n\nВы оба получили +${REFERRAL_PREMIUM_DAYS} дней Премиума`,
            },
        });

        return { referredUserDays: REFERRAL_PREMIUM_DAYS, referrerDays: REFERRAL_PREMIUM_DAYS };
    } catch (error) {
        console.error('Error processing referral reward:', error);
        return null;
    }
}

// POST - Create a new catch
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        
        const { userId } = auth;

        // Rate limiting
        const rateLimit = checkRateLimit(userId, CREATE_CATCH_LIMIT);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit);
        }

        const body = await request.json();
        
        // Validate input
        const validation = validateBody(createCatchSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: formatZodError(validation.error) }, { status: 400 });
        }
        
        const validatedData = validation.data;
        const isTextOnly = validatedData.isTextOnly ?? false;
        const postType = validatedData.postType || (isTextOnly ? 'text' : 'catch');
        
        // Build shared fields from validated data
        const sharedFields: any = {
            userId,
            description: validatedData.description || null,
            isPublic: validatedData.isPublic ?? true,
            location: validatedData.location || null,
            latitude: validatedData.latitude ?? null,
            longitude: validatedData.longitude ?? null,
            depth: validatedData.depth ?? null,
            waterTemp: validatedData.waterTemp ?? null,
            bait: validatedData.bait || null,
            method: validatedData.method || null,
            locationPrivate: validatedData.locationPrivate ?? false,
            postType,
        };
        
        // Add weatherData if provided
        if (validatedData.weatherData) {
            sharedFields.weatherData = validatedData.weatherData;
        }

        // Handle bait mix posts
        if (postType === 'bait_mix' && validatedData.baitMixData) {
            const baitMixCatch = await prisma.catch.create({
                data: {
                    ...sharedFields,
                    imageUrl: validatedData.imageUrl || null,
                    species: null,
                    weight: null,
                    length: null,
                    isTextOnly: false,
                    baitMixData: validatedData.baitMixData,
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            username: true,
                            photoUrl: true,
                            isPro: true,
                        },
                    },
                },
            });

            bustFeedCache();
            const response = NextResponse.json(baitMixCatch, { status: 201 });
            return addRateLimitHeaders(response, rateLimit);
        }

        // Handle multiple fish entries
        if (!isTextOnly && validatedData.fishEntries && validatedData.fishEntries.length > 0) {
            const createdCatches = await Promise.all(
                validatedData.fishEntries.map((entry) =>
                    prisma.catch.create({
                        data: {
                            ...sharedFields,
                            imageUrl: entry.imageUrl || null,
                            species: entry.species || null,
                            weight: entry.weight ?? null,
                            length: entry.length ?? null,
                            bait: entry.bait || sharedFields.bait,
                            method: entry.method || sharedFields.method,
                            isTextOnly: false,
                        },
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    username: true,
                                    photoUrl: true,
                                    isPro: true,
                                },
                            },
                        },
                    })
                )
            );

            // Process referral reward if this is user's first catch
            const referralResult = await processReferralReward(userId);

            bustFeedCache();
            const response = NextResponse.json({ 
                success: true, 
                catches: createdCatches,
                referralReward: referralResult,
            }, { status: 201 });
            return addRateLimitHeaders(response, rateLimit);
        }

        // For quick thought mode (isTextOnly), only store description
        if (isTextOnly || postType === 'text') {
            const textCatch = await prisma.catch.create({
                data: {
                    ...sharedFields,
                    isTextOnly: true,
                    imageUrl: null,
                    species: null,
                    weight: null,
                    length: null,
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            username: true,
                            photoUrl: true,
                            isPro: true,
                        },
                    },
                },
            });

            bustFeedCache();
            const response = NextResponse.json(textCatch, { status: 201 });
            return addRateLimitHeaders(response, rateLimit);
        }

        // Fallback: single fish entry (legacy behavior)
        const singleCatch = await prisma.catch.create({
            data: {
                ...sharedFields,
                imageUrl: validatedData.imageUrl || null,
                species: validatedData.species || null,
                weight: validatedData.weight ?? null,
                length: validatedData.length ?? null,
                isTextOnly: false,
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        username: true,
                        photoUrl: true,
                        isPro: true,
                    },
                },
            },
        });

        // Process referral reward if this is user's first catch
        const referralResult = await processReferralReward(userId);

        bustFeedCache();
        const response = NextResponse.json({ 
            ...singleCatch, 
            referralReward: referralResult 
        }, { status: 201 });
        return addRateLimitHeaders(response, rateLimit);
    } catch (error: any) {
        console.error('Create catch error:', error);
        const errorMessage = error?.message || String(error) || 'Internal Server Error';
        console.error('Error details:', {
            message: errorMessage,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack,
        });
        return NextResponse.json({ 
            error: errorMessage,
            code: error?.code,
            details: process.env.NODE_ENV === 'development' ? {
                message: errorMessage,
                code: error?.code,
                meta: error?.meta,
            } : undefined
        }, { status: 500 });
    }
}

