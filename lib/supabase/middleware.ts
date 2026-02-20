import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = ['/home', '/map', '/search', '/mypage', '/admin', '/team'];
const authPaths = ['/login'];

export async function updateSession(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const GET_USER_TIMEOUT_MS = 5000;
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null } }>((_, reject) =>
      setTimeout(() => reject(new Error('getUser timeout')), GET_USER_TIMEOUT_MS)
    );
    const { data: { user } } = await Promise.race([getUserPromise, timeoutPromise]);
    const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
    const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

    if (isProtected && !user) {
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthPage && user) {
      const next = url.searchParams.get('next') || '/home';
      url.pathname = next.startsWith('/') ? next : `/${next}`;
      url.searchParams.delete('next');
      return NextResponse.redirect(url);
    }
  } catch {
    // Supabase/네트워크 오류 시 인증 없이 진행 (로그인 필요 페이지는 해당 페이지에서 처리)
    return response;
  }

  return response;
}
