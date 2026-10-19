import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofpyltfjwnnafvgeqcmk.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runValidation() {
  console.log('=== AI Vitamin Reveal Day: Live Data Validation ===\n');

  // 1. Users
  const { data: users, error: uErr } = await supabase.from('users').select('*');
  if (uErr) throw uErr;

  const adminUsers = users.filter(u => u.role === 'admin');
  const regularUsers = users.filter(u => u.role !== 'admin');
  console.log(`1. Users Count: Total ${users.length} (Admin: ${adminUsers.length}, Regular Participants: ${regularUsers.length})`);

  // 2. Praises
  const { data: praises, error: pErr } = await supabase.from('praise_messages').select('*');
  if (pErr) throw pErr;
  console.log(`2. Praise Messages Count: Total ${praises.length}`);

  const cutoff = new Date('2026-10-27T23:59:59+09:00').getTime();
  const praisesBeforeCutoff = praises.filter(p => new Date(p.created_at).getTime() <= cutoff);
  const praisesAfterCutoff = praises.filter(p => new Date(p.created_at).getTime() > cutoff);
  console.log(`   - Praises before/at cutoff (2026-10-27 23:59:59 KST): ${praisesBeforeCutoff.length}`);
  console.log(`   - Praises after cutoff: ${praisesAfterCutoff.length}`);

  // 3. Private Notes
  const { data: notes, error: nErr } = await supabase.from('private_notes').select('*');
  if (nErr) throw nErr;
  console.log(`3. Private Notes Count: Total ${notes.length}`);

  // 4. Mate Assignments
  const { data: mates, error: mErr } = await supabase.from('mate_assignments').select('*');
  if (mErr) throw mErr;
  console.log(`4. Mate Assignments Count: Total ${mates.length}`);

  // Self-assignment check
  const selfAssignments = mates.filter(m => m.user_id === m.target_user_id);
  console.log(`   - Self assignments (user_id === target_user_id): ${selfAssignments.length} (Expected: 0)`);

  // Duplicate assignment check
  const pairSet = new Set();
  let duplicateCount = 0;
  for (const m of mates) {
    const key = `${m.user_id}->${m.target_user_id}`;
    if (pairSet.has(key)) duplicateCount++;
    pairSet.add(key);
  }
  console.log(`   - Duplicate assignments: ${duplicateCount} (Expected: 0)`);

  // Inbound & Outbound count per user
  const outboundMap = {};
  const inboundMap = {};
  regularUsers.forEach(u => {
    outboundMap[u.id] = 0;
    inboundMap[u.id] = 0;
  });

  mates.forEach(m => {
    outboundMap[m.user_id] = (outboundMap[m.user_id] || 0) + 1;
    inboundMap[m.target_user_id] = (inboundMap[m.target_user_id] || 0) + 1;
  });

  console.log(`5. Outbound Distribution (Each participant observes N mates):`);
  const outFreq = {};
  Object.values(outboundMap).forEach(cnt => {
    outFreq[cnt] = (outFreq[cnt] || 0) + 1;
  });
  console.log(`   ${JSON.stringify(outFreq)}`);

  console.log(`6. Inbound Distribution (Each participant is observed by N mates):`);
  const inFreq = {};
  let zeroInboundUsers = [];
  Object.entries(inboundMap).forEach(([uid, cnt]) => {
    inFreq[cnt] = (inFreq[cnt] || 0) + 1;
    if (cnt === 0) zeroInboundUsers.push(uid);
  });
  console.log(`   ${JSON.stringify(inFreq)}`);
  console.log(`   - Zero-inbound users: ${zeroInboundUsers.length}`);

  // 7. App State
  const { data: appState, error: sErr } = await supabase.from('app_state').select('*');
  if (sErr) throw sErr;
  console.log(`7. App State Keys (${appState.length}):`);
  appState.forEach(s => {
    console.log(`   - ${s.key}: ${JSON.stringify(s.value)}`);
  });

  console.log('\n=== Validation Complete ===');
}

runValidation().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});
