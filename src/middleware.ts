import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 1. RateLimit 설정
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15분

// 메모리 기반 캐시 (개발 환경용)
const rateLimitCache = new Map();

// 클라이언트 IP 추출
function getClientIp(req: NextRequest): string | null {
    const xff = req.headers.get('x-forwarded-for')
        || req.headers.get('x-real-ip')
        || req.headers.get('x-vercel-forwarded-for');
    if (!xff) return null;
    return xff.split(',')[0].trim();
}

// 2. CORS 허용 출처
const envOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : [];

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    ...envOrigins,
];

// 3. RateLimit 로직
function applyRateLimit(ip: string): boolean {
    const now = Date.now();

    if (!rateLimitCache.has(ip)) {
        rateLimitCache.set(ip, { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS });
    }

    const cache = rateLimitCache.get(ip);

    if (cache.resetTime < now) {
        cache.count = 0;
        cache.resetTime = now + RATE_LIMIT_WINDOW_MS;
    }

    cache.count += 1;
    return cache.count > RATE_LIMIT_MAX;
}

// 4. Middleware
export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    const origin = request.headers.get('origin');
    const response = NextResponse.next();

    // 🔹 RequestID 생성 및 설정
    const requestId = crypto.randomUUID();
    request.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Request-ID', requestId);

    console.log(`[RequestID: ${requestId}] ${request.method} ${url.pathname}`);

    // I. CORS 처리
    if ((origin && allowedOrigins.includes(origin)) || !origin) {
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // II. OPTIONS (Preflight)
    if (request.method === 'OPTIONS') {
        if ((origin && allowedOrigins.includes(origin)) || !origin) {
            const preflight = new Response(null, { status: 204 });
            preflight.headers.set('Access-Control-Allow-Origin', origin || '*');
            preflight.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
            preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
            preflight.headers.set('Access-Control-Allow-Credentials', 'true');
            return preflight;
        }
        return new Response('Not Allowed', { status: 403 });
    }

    // III. RateLimit (API 경로)
    if (url.pathname.startsWith('/api')) {
        const ip = getClientIp(request) ?? 'anonymous';
        if (applyRateLimit(ip)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '요청 속도가 너무 빠릅니다. 잠시 후 다시 시도해 주세요.',
                    requestId,
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(rateLimitCache.get(ip).resetTime),
                        'X-Request-ID': requestId,
                    },
                }
            );
        }
    }

    return response;
}

// 5. 미들웨어 적용 경로
export const config = {
    matcher: ['/api/:path*', '/:path*'],
};

