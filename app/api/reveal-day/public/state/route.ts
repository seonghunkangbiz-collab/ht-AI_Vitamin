import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'SUPABASE_UNCONFIGURED' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') || 'event-live-20261028';

  try {
    const supabase = getSupabaseServerClient();

    // 1. Fetch Public State
    let { data: pubState } = await supabase
      .from('reveal_public_state')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (!pubState) {
      // Return safe defaults
      return NextResponse.json({
        publicState: {
          eventId,
          mode: eventId.includes('rehearsal') ? 'rehearsal' : 'live',
          status: 'ready',
          currentSegment: 'opening',
          currentRevealIndex: 0,
          currentBatchIndex: 0,
          revealedPairsCount: 0,
          dataVersion: 1,
          sequence: 1,
          isBlackout: false,
          isHolding: false,
          reactionCounts: { heart: 0, clap: 0, party: 0, sparkle: 0, fire: 0 },
          checkinCount: 0,
          updatedAt: new Date().toISOString()
        }
      });
    }

    // 2. Fetch Latest Snapshot Stats if Journey or Opening segment
    let snapshotStats: any = null;
    const { data: snapshot } = await supabase
      .from('reveal_snapshots')
      .select('stats_payload, cutoff_at, data_hash, version')
      .eq('event_id', eventId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapshot) {
      snapshotStats = {
        version: snapshot.version,
        cutoffAt: snapshot.cutoff_at,
        dataHash: snapshot.data_hash,
        ...snapshot.stats_payload
      };
    }

    return NextResponse.json({
      publicState: {
        eventId: pubState.event_id,
        mode: pubState.mode,
        status: pubState.status,
        currentSegment: pubState.current_segment,
        currentRevealIndex: pubState.current_reveal_index,
        currentBatchIndex: pubState.current_batch_index,
        revealedPairsCount: pubState.revealed_pairs_count,
        dataVersion: pubState.data_version,
        sequence: pubState.sequence,
        isBlackout: pubState.is_blackout,
        isHolding: pubState.is_holding,
        reactionCounts: pubState.reaction_counts,
        checkinCount: pubState.checkin_count,
        lastDataSyncAt: pubState.last_data_sync_at,
        updatedAt: pubState.updated_at
      },
      snapshotStats
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
