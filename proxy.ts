import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const validUser = process.env.ADMIN_USER;
  const validPass = process.env.ADMIN_PASSWORD;
  const basicAuth = req.headers.get('authorization');

  // The login comes only from your hosting settings (ADMIN_USER / ADMIN_PASSWORD).
  // If they are missing, the admin stays locked rather than falling back to a default.
  if (validUser && validPass && basicAuth && basicAuth.startsWith('Basic ')) {
    try {
      const decoded = atob(basicAuth.slice(6).trim());
      const i = decoded.indexOf(':');
      if (i >= 0 && decoded.slice(0, i) === validUser && decoded.slice(i + 1) === validPass) {
        return NextResponse.next();
      }
    } catch {
      // malformed header: fall through to the login prompt
    }
  }

  return new NextResponse('Authentication Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Admin Dashboard"',
    },
  });
}

// Admin pages plus the two admin-only endpoints are protected; the customer storefront is unaffected.
export const config = {
  matcher: ['/admin/:path*', '/api/ambassador-reset', '/sms/send'],
};
