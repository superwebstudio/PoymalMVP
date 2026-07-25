import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, AI_LIMIT } from '@/lib/rate-limit';
import { logRequestAudit } from '@/lib/security-audit';

// Helper to handle BigInt serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export async function POST(req: NextRequest) {
    try {
        // Verify authentication
        const auth = await verifyAuth(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        
        const { userId } = auth;

        // Strict rate limiting for AI endpoints (expensive)
        const rateLimit = checkRateLimit(userId, AI_LIMIT);
        if (!rateLimit.success) {
            await logRequestAudit(req, {
                eventType: 'rate_limit',
                severity: 'warning',
                userId,
                message: 'AI identify rate limit exceeded',
            });
            return rateLimitResponse(rateLimit);
        }

        const body = await req.json();
        const { image } = body;

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        // Fetch User for limit check
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Usage limit check for free users
        if (!user.isPro) {
            // Reset monthly count if needed
            const now = new Date();
            const lastReset = user.lastAiReset;
            const monthsSinceReset = lastReset 
                ? (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth())
                : 1;
            
            if (monthsSinceReset >= 1) {
                // Reset the counter
                await prisma.user.update({
                    where: { id: userId },
                    data: { aiUsageCount: 0, lastAiReset: now },
                });
            } else if (user.aiUsageCount >= 1) {
                return NextResponse.json({ 
                    error: 'Monthly AI limit reached. Upgrade to Pro for unlimited identifications.',
                    code: 'AI_LIMIT_EXCEEDED'
                }, { status: 403 });
            }
        }

        // Log AI usage for monitoring
        await logRequestAudit(req, {
            eventType: 'data_access',
            severity: 'info',
            userId,
            message: 'AI fish identification requested',
            metadata: { isPro: user.isPro },
        });

        // MOCK RESPONSE - Replace with actual AI call
        const identification = { species_ru: "Щука", confidence: 0.95 };

        // Increment Usage
        await prisma.user.update({
            where: { id: userId },
            data: {
                aiUsageCount: { increment: 1 },
            },
        });

        return NextResponse.json(identification);

    } catch (error) {
        console.error('Identify error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

