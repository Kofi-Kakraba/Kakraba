import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    // Decode the credentials from the browser request
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // Pull keys from your environment variables (with fallback values for local safety)
    const validUser = process.env.ADMIN_USER || 'mr sparkle';
    const validPass = process.env.ADMIN_PASSWORD || 'sp@rks91';

    if (user === validUser && pwd === validPass) {
      return NextResponse.next(); // Keys match! Allow them into the admin hub
    }
  }

  // If credentials are missing or wrong, prompt the browser login modal
  return new NextResponse('Authentication Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Admin Dashboard"',
    },
  });
}

// The matcher guarantees this code ONLY intercepts /admin paths, 
// leaving your main customer storefront completely unaffected and blazing fast.
export const config = {
  matcher: ['/admin/:path*'],
};