/**
 * 평가(코멘트) 수정 / 삭제. 본인 작성분만 가능.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });

  const { supabase, user } = await getSupabaseWithAuth();
  if (!supabase || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { comment, rating } = body as { comment?: string | null; rating?: number | null };

  const updates: { comment?: string | null; rating?: number | null } = {};
  if (comment !== undefined) updates.comment = comment ?? null;
  if (rating !== undefined) {
    if (rating === null) updates.rating = null;
    else {
      const r = Number(rating);
      if (r >= 1 && r <= 5) updates.rating = r;
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '수정할 필드(comment, rating)가 없습니다.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('evaluations')
    .update(updates)
    .eq('id', id)
    .eq('evaluator_id', user.id)
    .select('id, comment, rating, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: '해당 평가를 수정할 수 없습니다.' }, { status: 403 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });

  const { supabase, user } = await getSupabaseWithAuth();
  if (!supabase || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', id)
    .eq('evaluator_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
