import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import { PROTECTED_PREFIXES, ROUTES } from '@/constants/routes';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.signIn;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith('/auth') &&
    user &&
    !pathname.startsWith(ROUTES.authCallback) &&
    !pathname.startsWith('/auth/sign-out')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    return NextResponse.redirect(url);
  }

  return response;
}
