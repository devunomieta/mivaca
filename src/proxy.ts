import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Role } from '@/types';

// Role-to-route mapping
const ROLE_ROUTES: Record<Role, string> = {
  student: '/student',
  maintenance_officer: '/officer',
  admin: '/admin',
};

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (critical for SSR auth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes — no auth needed
  const publicRoutes = ['/', '/login', '/register', '/api/docs'];
  const isPublicRoute = publicRoutes.some((r) => pathname === r || pathname.startsWith('/api/docs'));

  // Protected dashboard routes
  const isDashboardRoute =
    pathname.startsWith('/student') ||
    pathname.startsWith('/officer') ||
    pathname.startsWith('/admin');

  // Not logged in — redirect to login
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // Logged in — redirect away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    // Fetch role_id and redirect to correct dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    const roleId = profile?.role_id ?? 1;
    const ROLE_ROUTES_BY_ID: Record<number, string> = { 1: '/student', 2: '/officer', 3: '/admin' };
    return NextResponse.redirect(new URL(ROLE_ROUTES_BY_ID[roleId] ?? '/student', request.url));
  }

  // Role-based route protection
  if (user && isDashboardRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    const roleId = profile?.role_id ?? 1;
    const ROLE_ROUTES_BY_ID: Record<number, string> = { 1: '/student', 2: '/officer', 3: '/admin' };
    const allowedBase = ROLE_ROUTES_BY_ID[roleId] ?? '/student';

    if (!pathname.startsWith(allowedBase)) {
      return NextResponse.redirect(new URL(allowedBase, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
