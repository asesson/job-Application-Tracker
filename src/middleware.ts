import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // TEMPORARY: Disable middleware for testing
  return NextResponse.next();

  // Original middleware code (disabled for now)
  /*
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check for auth token in cookies - try different cookie patterns
  const authTokenVariants = [
    'sb-hyaoslsqmzxkqhttzzro-auth-token',
    'sb-hyaoslsqmzxkqhttzzro-auth-token-code-verifier',
    'supabase-auth-token',
    'supabase.auth.token'
  ];

  let hasAuthCookie = false;
  let foundCookie = '';

  // Check all possible auth cookie names
  for (const cookieName of authTokenVariants) {
    const cookie = request.cookies.get(cookieName);
    if (cookie) {
      hasAuthCookie = true;
      foundCookie = cookieName;
      break;
    }
  }

  // Also check if any cookie starts with 'sb-' (Supabase cookies)
  if (!hasAuthCookie) {
    const allCookies = request.cookies.getAll();
    const supabaseCookie = allCookies.find(cookie =>
      cookie.name.startsWith('sb-') && cookie.name.includes('auth')
    );
    if (supabaseCookie) {
      hasAuthCookie = true;
      foundCookie = supabaseCookie.name;
    }
  }

  console.log('Middleware - Auth cookie present:', hasAuthCookie, foundCookie);
  console.log('Middleware - Path:', request.nextUrl.pathname);
  console.log('Middleware - All cookies:', request.cookies.getAll().map(c => c.name));

  // Protected routes
  const protectedRoutes = ['/dashboard', '/applications', '/board', '/analytics'];
  const authRoutes = ['/login', '/signup'];
  const publicRoutes = ['/debug', '/test-login', '/dashboard-test'];

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Allow public routes through
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // Only redirect to login if accessing protected route AND no auth cookie
  if (isProtectedRoute && !hasAuthCookie) {
    console.log('Redirecting to login - no auth cookie');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Don't redirect authenticated users away from auth pages for now
  // This prevents the redirect loop

  // Handle root path
  if (request.nextUrl.pathname === '/') {
    if (hasAuthCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return supabaseResponse;
  */
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};