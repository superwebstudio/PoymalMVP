import { NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter
 * For production with multiple instances, use Redis-based solution
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store: key -> { count, resetAt }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Identifier for the rate limit (for different limits per endpoint) */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs, identifier = 'default' } = config;
  const fullKey = `${identifier}:${key}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(fullKey);
  
  // If no entry or window expired, create new
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(fullKey, entry);
    
    return {
      success: true,
      remaining: limit - 1,
      resetAt: entry.resetAt,
      limit,
    };
  }
  
  // Check if over limit
  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit,
    };
  }
  
  // Increment count
  entry.count++;
  
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
    limit,
  };
}

/**
 * Rate limit response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  
  return NextResponse.json(
    { 
      error: 'Too many requests', 
      retryAfter,
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
    },
    { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetAt.toString(),
        'Retry-After': retryAfter.toString(),
      }
    }
  );
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetAt.toString());
  return response;
}

// ============================================
// Preset Configurations
// ============================================

/**
 * Standard API rate limit - 60 requests per minute
 */
export const STANDARD_LIMIT: RateLimitConfig = {
  limit: 60,
  windowMs: 60 * 1000,
  identifier: 'standard',
};

/**
 * Auth rate limit - 10 requests per minute (prevent brute force)
 */
export const AUTH_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60 * 1000,
  identifier: 'auth',
};

/**
 * Upload rate limit - 20 uploads per minute
 */
export const UPLOAD_LIMIT: RateLimitConfig = {
  limit: 20,
  windowMs: 60 * 1000,
  identifier: 'upload',
};

/**
 * AI rate limit - 5 requests per minute (expensive operations)
 */
export const AI_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 60 * 1000,
  identifier: 'ai',
};

/**
 * Comment rate limit - 30 per minute (prevent spam)
 */
export const COMMENT_LIMIT: RateLimitConfig = {
  limit: 30,
  windowMs: 60 * 1000,
  identifier: 'comment',
};

/**
 * Reaction rate limit - 60 per minute
 */
export const REACTION_LIMIT: RateLimitConfig = {
  limit: 60,
  windowMs: 60 * 1000,
  identifier: 'reaction',
};

/**
 * Create catch rate limit - 10 per minute
 */
export const CREATE_CATCH_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60 * 1000,
  identifier: 'create_catch',
};

/**
 * Bug report rate limit - 5 per hour
 */
export const BUG_REPORT_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 60 * 60 * 1000,
  identifier: 'bug_report',
};

