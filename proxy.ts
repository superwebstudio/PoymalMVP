import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global proxy for security headers and request processing
 */
export function proxy(request: NextRequest) {
    // Get response
    const response = NextResponse.next();

    // ============================================
    // Security Headers
    // ============================================

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter (legacy browsers)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy (disable features we don't use)
    response.headers.set('Permissions-Policy',
        'camera=(), microphone=(), geolocation=(self), payment=()'
    );

    // Content Security Policy
    // Note: This is a baseline - adjust based on your actual needs
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' https://api.mapbox.com https://*.mapbox.com https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.open-meteo.com https://marine-api.open-meteo.com https://nominatim.openstreetmap.org",
        "worker-src 'self' blob:",
        "child-src 'self' blob:",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    // HSTS (only in production with HTTPS)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains'
        );
    }

    return response;
}

/**
 * Configure which paths the proxy runs on
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/webhook).*)',
    ],
};

