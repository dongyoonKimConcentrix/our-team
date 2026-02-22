/**
 * 팀 수정 (블랙리스트 등). 관리자만 가능.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ teamId: string }> };

async function getSupabaseWithAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return { supabase: null, user: null, isAdmin: false };
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ignore
        }
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  const isAdmin = adminIds.includes(user.id) || (user.email != null && adminEmails.includes(user.email));
  return { supabase, user, isAdmin };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { teamId } = await params;
  if (!teamId) return NextResponse.json({ error: 'teamId 필요' }, { status: 400 });

  const { isAdmin } = await getSupabaseWithAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: '관리자만 수정할 수 있습니다.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { is_blacklisted } = body as { is_blacklisted?: boolean };

  if (typeof is_blacklisted !== 'boolean') {
    return NextResponse.json({ error: 'is_blacklisted(boolean)가 필요합니다.' }, { status: 400 });
  }

  try {
    const admin = createServerSupabaseAdminClient();
    const { error } = await admin
      .from('teams')
      .update({ is_blacklisted, updated_at: new Date().toISOString() })
      .eq('id', teamId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, is_blacklisted });
  } catch {
    return NextResponse.json({ error: '서버 설정이 없습니다.' }, { status: 500 });
  }
}
