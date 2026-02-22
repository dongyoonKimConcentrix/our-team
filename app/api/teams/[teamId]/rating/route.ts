/**
 * 팀별 별점: 1인 1팀당 최신 1건. GET = 내 별점, POST = 별점 등록/갱신.
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
          // ignore
        }
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

/** 내 별점 조회 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { teamId } = await params;
  if (!teamId) return NextResponse.json({ error: 'teamId 필요' }, { status: 400 });

  const { supabase, user } = await getSupabaseWithAuth();
  if (!supabase || !user) {
    return NextResponse.json({ rating: null }, { status: 200 });
  }

  const { data } = await supabase
    .from('team_ratings')
    .select('rating')
    .eq('evaluator_id', user.id)
    .eq('target_team_id', teamId)
    .maybeSingle();

  const row = data as { rating: number } | null;
  return NextResponse.json({ rating: row?.rating ?? null });
}

/** 별점 등록/갱신 (1~5) */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { teamId } = await params;
  if (!teamId) return NextResponse.json({ error: 'teamId 필요' }, { status: 400 });

  const { supabase, user } = await getSupabaseWithAuth();
  if (!supabase || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rating = Number((body as { rating?: number }).rating);
  if (!(rating >= 1 && rating <= 5)) {
    return NextResponse.json({ error: '별점은 1~5 사이로 선택해 주세요.' }, { status: 400 });
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (!existingProfile) {
    try {
      const admin = createServerSupabaseAdminClient();
      await admin.from('profiles').insert({
        id: user.id,
        name: user.email ?? user.user_metadata?.name ?? null,
        is_active: true,
      });
    } catch {
      return NextResponse.json(
        { error: '프로필을 생성할 수 없습니다. 관리자에게 문의해 주세요.' },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabase
    .from('team_ratings')
    .upsert(
      {
        evaluator_id: user.id,
        target_team_id: teamId,
        rating,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'evaluator_id,target_team_id' }
    )
    .select('rating')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ rating: (data as { rating: number }).rating });
}
