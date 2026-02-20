/**
 * 현재 로그인 사용자 정보 및 관리자 여부.
 * 관리자 판별: .env에 ADMIN_USER_IDS(쉼표 구분 UUID) 또는 ADMIN_EMAILS(쉼표 구분 이메일) 설정.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ user: null, isAdmin: false }, { status: 200 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 등에서 호출 시 무시
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, isAdmin: false }, { status: 200 });
  }

  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  const isAdmin =
    adminIds.includes(user.id) || (user.email != null && adminEmails.includes(user.email));

  return NextResponse.json({
    user: { id: user.id, email: user.email ?? undefined },
    isAdmin,
  });
}
