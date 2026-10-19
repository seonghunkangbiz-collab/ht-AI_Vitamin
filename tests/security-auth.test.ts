import test from 'node:test';
import assert from 'node:assert';
import { signSessionToken, verifySessionToken, requireAuth, requireAdmin } from '@/lib/auth/session';
import { sanitizeUserForPublic, verifyAdminCode, checkLoginRateLimit } from '@/lib/reveal-day/security';
import { getSupabaseServerClient, getSupabaseAdminClient, SupabaseSecretKeyMissingError } from '@/lib/supabase/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as praisesHandler } from '@/app/api/praises/route';
import { GET as matesHandler } from '@/app/api/mates/route';
import { GET as notesHandler, POST as postNoteHandler } from '@/app/api/notes/route';
import { GET as usersHandler } from '@/app/api/users/route';

// Mock fetch for isolated unit testing of API security & filtering logic
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr = String(input);

  if (urlStr.includes('/rest/v1/praise_messages')) {
    return new Response(JSON.stringify([
      { id: 'p1', sender_user_id: 'user-01', recipient_user_id: 'user-02', recipient_name: '이은정', content: '항상 밝은 에너지로 협업해 주셔서 감사합니다.', created_at: '2026-10-20T10:00:00Z', likes: 2 }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (urlStr.includes('/rest/v1/users')) {
    return new Response(JSON.stringify([
      { id: 'user-01', name: '홍태영', team: 'Hi-Tech 사업본부', avatar: '👨‍💼', role: 'user', code: 'VIT-SECRET-01', employee_number: '01217' },
      { id: 'user-02', name: '이은정', team: '전략사업개발팀', avatar: '👩‍💼', role: 'user', code: 'VIT-SECRET-02', employee_number: '09150' },
      { id: 'user-admin', name: '관리자', team: '운영팀', avatar: '👑', role: 'admin', code: 'ADMIN-SECRET-99' }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (urlStr.includes('/rest/v1/app_state')) {
    return new Response(JSON.stringify([
      { key: 'reveal_active', value: { active: false } }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (urlStr.includes('/rest/v1/mate_assignments')) {
    return new Response(JSON.stringify([
      { user_id: 'user-01', target_user_id: 'user-02' }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (urlStr.includes('/rest/v1/private_notes')) {
    if (init?.method === 'POST') {
      return new Response(JSON.stringify({
        id: 'note-01',
        user_id: 'user-01',
        target_user_id: 'user-03',
        content: 'Spoofed note test',
        updated_at: '2026-10-20T10:00:00Z'
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify([
      { id: 'note-01', user_id: 'user-01', target_user_id: 'user-02', content: '비밀 관찰 메모', updated_at: '2026-10-20T10:00:00Z' }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return originalFetch(input, init);
};

test('1. 로컬스토리지 role="admin" 변조 방지: 쿠키 세션 서명 없는 위조 요청 차단', async () => {
  // A forged request without valid signed HttpOnly cookie (even if header claims admin or body claims admin)
  const req = new Request('http://localhost:3000/api/admin/reveal-day/state', {
    method: 'GET',
    headers: { 'Cookie': 'ai_vitamin_session=invalid-tampered-token-role-admin' }
  });

  const authResult = await requireAdmin(req);
  assert.ok('errorResponse' in authResult, 'Forged role in local state must fail authentication');
  const res = authResult.errorResponse;
  assert.strictEqual(res.status, 401, 'Should return 401 Unauthorized for tampered session token');
});

test('2. ?admin=true 쿼리만으로 praise 발신자(senderUserId) 정보 미반환 검증', async () => {
  // Regular request with query ?admin=true but NO admin session cookie
  const req = new Request('http://localhost:3000/api/praises?admin=true', {
    method: 'GET'
  });

  const res = await praisesHandler(req);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.praises));

  // Verify that senderUserId is undefined for all praises
  for (const praise of data.praises) {
    assert.strictEqual(praise.senderUserId, undefined, 'Sender ID must NOT be disclosed without verified admin session cookie');
  }
});

test('3. 사용자 A가 사용자 B의 메모/메이트 데이터 조회 및 수정 불가 (세션 격리)', async () => {
  // User A has valid session
  const userAToken = signSessionToken({
    userId: 'user-01',
    role: 'user',
    name: '홍태영',
    team: 'Hi-Tech 사업본부'
  });

  // User A tries to view User B's notes by specifying userId=user-02 in query
  const queryReq = new Request('http://localhost:3000/api/notes?userId=user-02', {
    method: 'GET',
    headers: { 'Cookie': `ai_vitamin_session=${userAToken}` }
  });

  const notesRes = await notesHandler(queryReq);
  assert.strictEqual(notesRes.status, 403, 'User A should receive 403 Forbidden when requesting User B notes');

  // User A tries to view User B's mates
  const matesReq = new Request('http://localhost:3000/api/mates?userId=user-02', {
    method: 'GET',
    headers: { 'Cookie': `ai_vitamin_session=${userAToken}` }
  });

  const matesRes = await matesHandler(matesReq);
  assert.strictEqual(matesRes.status, 403, 'User A should receive 403 Forbidden when requesting User B mates');

  // User A tries to post a note pretending to be User B
  const postReq = new Request('http://localhost:3000/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `ai_vitamin_session=${userAToken}`
    },
    body: JSON.stringify({
      userId: 'user-02', // Trying to spoof user-02
      targetUserId: 'user-03',
      content: 'Spoofed note test'
    })
  });

  // Note handler must force author to session.userId ('user-01')
  const postRes = await postNoteHandler(postReq);
  assert.strictEqual(postRes.status, 200);
  const postData = await postRes.json();
  assert.strictEqual(postData.note.userId, 'user-01', 'Author must be enforced to session.userId, preventing spoofing');
});

test('4. Reveal 전 네트워크 응답에 Mystery Mate 비밀 관계와 관찰 메모 원문 없음', async () => {
  const userToken = signSessionToken({
    userId: 'user-01',
    role: 'user',
    name: '홍태영',
    team: 'Hi-Tech 사업본부'
  });

  const req = new Request('http://localhost:3000/api/mates', {
    method: 'GET',
    headers: { 'Cookie': `ai_vitamin_session=${userToken}` }
  });

  const res = await matesHandler(req);
  assert.strictEqual(res.status, 200);
  const data = await res.json();

  if (!data.isRevealActive) {
    assert.deepStrictEqual(data.myMysteryMates, [], 'Before reveal active, incoming mystery mates must be empty');
  }
});

test('18. Supabase secret key 미설정 시 민감 API fail-closed 검증', () => {
  // Check fail-closed behavior on getSupabaseAdminClient when secret key is unset
  const originalSecret = process.env.SUPABASE_SECRET_KEY;
  try {
    delete process.env.SUPABASE_SECRET_KEY;
    assert.throws(() => {
      getSupabaseAdminClient();
    }, SupabaseSecretKeyMissingError, 'Must fail-closed when secret key is missing');
  } finally {
    if (originalSecret) process.env.SUPABASE_SECRET_KEY = originalSecret;
  }
});

test('19. 일반 사용자 API에서 code, 사번, 관리자 자격정보 일체 미노출 검증', async () => {
  const userToken = signSessionToken({
    userId: 'user-01',
    role: 'user',
    name: '홍태영',
    team: 'Hi-Tech 사업본부'
  });

  const req = new Request('http://localhost:3000/api/users', {
    method: 'GET',
    headers: { 'Cookie': `ai_vitamin_session=${userToken}` }
  });

  const res = await usersHandler(req);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.users));

  for (const u of data.users) {
    assert.strictEqual((u as any).code, undefined, 'User code must not be exposed in public users API');
    assert.strictEqual((u as any).employeeNumber, undefined, 'Employee number must not be exposed');
    assert.notStrictEqual(u.role, 'admin', 'Admin account credentials should not be exposed to general users');
  }
});
