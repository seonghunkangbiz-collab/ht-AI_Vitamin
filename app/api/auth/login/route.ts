import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_USERS } from '@/lib/seedData';
import { signSessionToken, createSessionCookie, checkCsrf } from '@/lib/auth/session';
import { checkLoginRateLimit, verifyAdminCode, resetLoginRateLimit } from '@/lib/reveal-day/security';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: 'CSRF_VALIDATION_FAILED' }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { code, userId } = body || {};
    if ((!code || typeof code !== 'string') && (!userId || typeof userId !== 'string')) {
      return NextResponse.json({ error: '참여코드 또는 사번을 입력해 주세요.' }, { status: 400 });
    }

    const rawInput = typeof code === 'string' ? code.trim() : '';
    const supabase = getSupabaseServerClient();

    // Fast path: background session cookie recovery by userId (for already-logged-in localStorage users)
    if (!rawInput && userId) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, code, name, team, avatar, role')
        .eq('id', userId.trim())
        .maybeSingle();

      if (existingUser) {
        const role = existingUser.role === 'admin' ? 'admin' : 'user';
        const token = signSessionToken({
          userId: existingUser.id,
          role,
          name: existingUser.name,
          team: existingUser.team,
          avatar: existingUser.avatar
        });
        const cookieHeader = createSessionCookie(token);
        const response = NextResponse.json({
          user: {
            id: existingUser.id,
            code: existingUser.code,
            name: existingUser.name,
            team: existingUser.team,
            avatar: existingUser.avatar,
            role
          }
        });
        response.headers.set('Set-Cookie', cookieHeader);
        return response;
      }
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 1. Rate Limiting Check
    const rateLimit = checkLoginRateLimit(rawInput);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `로그인 시도가 너무 많습니다. ${rateLimit.retryAfterSeconds}초 후에 다시 시도해 주세요.` },
        { status: 429 }
      );
    }

    const upperInput = rawInput.toUpperCase();
    const paddedInput = rawInput.padStart(5, '0');

    // 2. Check for Admin Login via secure hash comparison
    const isAdminCode = verifyAdminCode(rawInput);
    if (isAdminCode) {
      // Find admin user in DB
      let { data: adminUser } = await supabase
        .from('users')
        .select('id, name, team, avatar, role')
        .eq('role', 'admin')
        .maybeSingle();

      if (!adminUser) {
        // Fallback search by admin id
        const { data: adminById } = await supabase
          .from('users')
          .select('id, name, team, avatar, role')
          .eq('id', 'admin-01')
          .maybeSingle();
        adminUser = adminById;
      }

      if (adminUser) {
        resetLoginRateLimit(rawInput);
        const token = signSessionToken({
          userId: adminUser.id,
          role: 'admin',
          name: adminUser.name,
          team: adminUser.team,
          avatar: adminUser.avatar
        });

        const cookieHeader = createSessionCookie(token);

        const response = NextResponse.json({
          user: {
            id: adminUser.id,
            name: adminUser.name,
            team: adminUser.team,
            avatar: adminUser.avatar,
            role: 'admin'
          }
        });

        response.headers.set('Set-Cookie', cookieHeader);
        return response;
      }
    }

    // 3. Regular Participant Login: Find in seed mapping or Supabase
    const seedUser = INITIAL_USERS.find(
      u => (u.code && u.code.toUpperCase() === upperInput) ||
           (u.employeeNumber && (u.employeeNumber === rawInput || u.employeeNumber === paddedInput)) ||
           (u.name && u.name.trim() === rawInput)
    );

    const queryCode = seedUser?.code ? seedUser.code : upperInput;

    let { data: user } = await supabase
      .from('users')
      .select('id, code, name, team, avatar, role')
      .eq('code', queryCode)
      .maybeSingle();

    if (!user && seedUser) {
      const { data: userById } = await supabase
        .from('users')
        .select('id, code, name, team, avatar, role')
        .eq('id', seedUser.id)
        .maybeSingle();
      user = userById;
    }

    // Auto-upsert specific seed user if found in INITIAL_USERS but not yet registered in DB
    if (!user && seedUser) {
      const { data: upsertedUser } = await supabase
        .from('users')
        .upsert({
          id: seedUser.id,
          code: seedUser.code,
          name: seedUser.name,
          team: seedUser.team,
          avatar: seedUser.avatar,
          role: 'user'
        })
        .select('id, code, name, team, avatar, role')
        .maybeSingle();

      user = upsertedUser || {
        id: seedUser.id,
        code: seedUser.code,
        name: seedUser.name,
        team: seedUser.team,
        avatar: seedUser.avatar,
        role: 'user'
      };
    }

    // Fallback: check by name if not found by code
    if (!user) {
      const { data: userByName } = await supabase
        .from('users')
        .select('id, code, name, team, avatar, role')
        .eq('name', rawInput)
        .maybeSingle();
      if (userByName) {
        user = userByName;
      }
    }

    if (!user) {
      return NextResponse.json({ error: '올바르지 않은 참여코드 또는 사번입니다.' }, { status: 404 });
    }

    resetLoginRateLimit(rawInput);

    // Issue signed HttpOnly session cookie
    const token = signSessionToken({
      userId: user.id,
      role: (user.role === 'admin' ? 'admin' : 'user'),
      name: user.name,
      team: user.team,
      avatar: user.avatar
    });

    const cookieHeader = createSessionCookie(token);

    const formattedUser = {
      id: user.id,
      code: user.code,
      name: user.name,
      team: user.team,
      avatar: user.avatar,
      role: user.role === 'admin' ? 'admin' : 'user'
    };

    const response = NextResponse.json({ user: formattedUser });
    response.headers.set('Set-Cookie', cookieHeader);
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
