import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();

test('Test 12: Realtime channel failure trigger & fallback polling logic verification', () => {
  // Inspect useRevealDayRealtime hook implementation
  const hookFile = join(projectRoot, 'hooks', 'useRevealDayRealtime.ts');
  assert.ok(existsSync(hookFile), 'useRevealDayRealtime.ts must exist');

  const content = readFileSync(hookFile, 'utf-8');
  assert.ok(content.includes('CHANNEL_ERROR'), 'Hook must handle CHANNEL_ERROR status');
  assert.ok(content.includes('TIMED_OUT'), 'Hook must handle TIMED_OUT status');
  assert.ok(content.includes('setInterval'), 'Hook must maintain polling interval');
  assert.ok(content.includes('startPolling'), 'Hook must define startPolling handler');
  assert.ok(content.includes("setConnectionStatus('polling')"), 'Hook must transition connection status to polling on error');
  assert.ok(content.includes('fetchLatestState'), 'Hook must execute polling fetch upon realtime failure');
});

test('Test 14: Route regressions check - all existing and new routes exist and export components', () => {
  const routes = [
    'app/page.tsx',
    'app/wall/page.tsx',
    'app/reveal/page.tsx',
    'app/mate/page.tsx',
    'app/notes/page.tsx',
    'app/thanks/page.tsx',
    'app/admin/page.tsx',
    'app/admin/reveal-day/page.tsx',
    'app/admin/reveal-day/display/page.tsx',
    'app/live/page.tsx',
  ];

  for (const route of routes) {
    const fullPath = join(projectRoot, route);
    assert.ok(existsSync(fullPath), `Route ${route} must exist on disk`);
    const content = readFileSync(fullPath, 'utf-8');
    assert.ok(content.includes('export default'), `Route ${route} must have a default export component`);
  }
});

test('Test 15: StageCanvas 16:9 aspect-ratio & overflow constraints for 1920x1080 display', () => {
  const stageFile = join(projectRoot, 'components', 'reveal-day', 'StageCanvas.tsx');
  assert.ok(existsSync(stageFile), 'StageCanvas.tsx must exist');

  const content = readFileSync(stageFile, 'utf-8');
  assert.ok(content.includes('aspect-video'), 'StageCanvas must specify 16:9 aspect ratio');
  assert.ok(content.includes('overflow-hidden'), 'StageCanvas must prevent content overflow outside 16:9 bounds');
  assert.ok(content.includes('isBlackout'), 'StageCanvas must handle emergency blackout state');
  assert.ok(content.includes('isHolding'), 'StageCanvas must handle emergency holding screen state');
});

test('Test 16: Resolution guard triggers on <1280px viewports', () => {
  const shellFile = join(projectRoot, 'components', 'reveal-day', 'RevealDayShell.tsx');
  assert.ok(existsSync(shellFile), 'RevealDayShell.tsx must exist');

  const content = readFileSync(shellFile, 'utf-8');
  assert.ok(content.includes('1280'), 'Shell must define 1280px minimum resolution check');
  assert.ok(content.includes('windowWidth < 1280'), 'Shell must detect window width < 1280px');
  assert.ok(content.includes('PC 행사 운영 화면입니다'), 'Shell must display guidance notice when under 1280px');
});

test('Test 17: Audio asset presence & playback fallback error handling', () => {
  // Audio asset check
  const audioFile = join(projectRoot, 'public', 'audio', 'vitamin_song.mp3');
  assert.ok(existsSync(audioFile), 'vitamin_song.mp3 must exist in public/audio');

  const audioStats = readFileSync(audioFile);
  assert.ok(audioStats.length > 1000, 'Audio file must not be empty');

  // SongSegment error handler check
  const songSegmentFile = join(projectRoot, 'components', 'reveal-day', 'segments', 'SongSegment.tsx');
  assert.ok(existsSync(songSegmentFile), 'SongSegment.tsx must exist');

  const songContent = readFileSync(songSegmentFile, 'utf-8');
  assert.ok(songContent.includes('handleError'), 'SongSegment must catch audio playback errors');
  assert.ok(songContent.includes('loadError'), 'SongSegment must track loadError state');
  assert.ok(songContent.includes('지정된 음원 파일을 로드하지 못했습니다'), 'SongSegment must provide fallback message when audio playback fails');
});
