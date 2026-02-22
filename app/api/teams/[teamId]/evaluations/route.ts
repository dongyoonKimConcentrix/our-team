/**
 * 팀에 대한 코멘트 등록. 별점은 별도 API(/api/teams/[teamId]/rating) 사용.
 * match_id 필수, comment만 보내도 됨. rating은 선택(넣으면 저장, 없으면 null).
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ teamId: string }> };

async function getSupabaseWithAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return { supabase: null, user: null };
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
          // ignore in API
        }
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { teamId } = await params;
  if (!teamId) return NextResponse.json({ error: 'teamId 필요' }, { status: 400 });

  const { supabase, user } = await getSupabaseWithAuth();
  if (!supabase || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { match_id, rating, comment } = body as { match_id?: string; rating?: number | null; comment?: string | null };
  if (!match_id || typeof match_id !== 'string') {
    return NextResponse.json({ error: 'match_id 필요' }, { status: 400 });
  }
  const r =
    rating == null || rating === undefined
      ? null
      : Number(rating);
  if (r !== null && !(r >= 1 && r <= 5)) {
    return NextResponse.json({ error: 'rating은 1~5 사이여야 합니다.' }, { status: 400 });
  }

  // evaluator_id FK: profiles에 로그인 사용자 행이 없으면 생성
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (!existingProfile) {
    try {
      const admin = createServerSupabaseAdminClient();
      const { error: insertErr } = await admin.from('profiles').insert({
        id: user.id,
        name: user.email ?? user.user_metadata?.name ?? null,
        is_active: true,
      });
      if (insertErr && insertErr.code !== '23505') {
        return NextResponse.json(
          { error: insertErr.message ?? '프로필 생성에 실패했습니다.' },
          { status: 500 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: '프로필을 생성할 수 없습니다. 관리자에게 문의해 주세요.' },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabase
    .from('evaluations')
    .insert({
      evaluator_id: user.id,
      target_team_id: teamId,
      match_id,
      rating: r ?? null,
      comment: comment ?? null,
    })
    .select('id, comment, rating, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
