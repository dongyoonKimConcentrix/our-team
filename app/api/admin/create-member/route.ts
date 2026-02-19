import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: '서버 설정이 없습니다.' }, { status: 500 });
  }
  const body = await request.json();
  const { id, password, name } = body as { id?: string; password?: string; name?: string };
  if (!id || !password) {
    return Response.json({ error: '아이디, 비밀번호가 필요합니다.' }, { status: 400 });
  }
  const idTrim = String(id).trim();
  if (!idTrim) {
    return Response.json({ error: '아이디를 입력해주세요.' }, { status: 400 });
  }
  const email = idTrim.includes('@') ? idTrim : `${idTrim}@team.local`;
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: user, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name ?? '', login_id: idTrim },
  });
  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 });
  }
  if (!user.user?.id) {
    return Response.json({ error: '사용자 생성 실패' }, { status: 500 });
  }
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.user.id,
    name: (name && String(name).trim()) || null,
    is_active: true,
    deleted_at: null,
  });
  if (profileError) {
    return Response.json({ error: `계정 생성됨. 프로필 저장 실패: ${profileError.message}` }, { status: 500 });
  }
  return Response.json({ id: user.user.id, login_id: idTrim });
}
