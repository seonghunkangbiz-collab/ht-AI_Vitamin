export type RevealSegment = 
  | 'opening'
  | 'journey'
  | 'mate_reveal'
  | 'time_capsule'
  | 'lucky_draw'
  | 'song'
  | 'closing'
  | 'pizza_party'
  | 'ended';

export type RevealMode = 'live' | 'rehearsal';

export type RevealStatus = 'draft' | 'rehearsal' | 'ready' | 'live' | 'ended';

export interface RevealEvent {
  id: string;
  mode: RevealMode;
  status: RevealStatus;
  title: string;
  concept: string;
  scheduledAt: string;
  cutoffAt: string;
  currentSegment: RevealSegment;
  currentRevealIndex: number;
  currentBatchIndex: number;
  version: number;
  controllerId?: string | null;
  controllerName?: string | null;
  controllerLeaseUntil?: string | null;
  isBlackout: boolean;
  isHolding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReactionCounts {
  heart: number;
  clap: number;
  party: number;
  sparkle: number;
  fire: number;
}

export interface RevealPublicState {
  eventId: string;
  mode: RevealMode;
  status: RevealStatus;
  currentSegment: RevealSegment;
  currentRevealIndex: number;
  currentBatchIndex: number;
  revealedPairsCount: number;
  dataVersion: number;
  sequence: number;
  isBlackout: boolean;
  isHolding: boolean;
  reactionCounts: ReactionCounts;
  checkinCount: number;
  lastDataSyncAt?: string;
  updatedAt: string;
}

export interface RevealSnapshot {
  id: string;
  eventId: string;
  version: number;
  cutoffAt: string;
  dataHash: string;
  sourceUsersCount: number;
  sourcePraisesCount: number;
  sourceNotesCount: number;
  sourceMaxTimestamp: string | null;
  statsPayload: {
    totalUsers: number;
    totalPraises: number;
    weeklyPraises: number;
    totalNotes: number;
    wallViews: number;
    teamStats: Record<string, { praiseGiven: number; praiseReceived: number; userCount: number }>;
    keywords: string[];
    approvedQuotes: Array<{ id: string; content: string; team?: string }>;
  };
  createdBy: string;
  reason?: string;
  createdAt: string;
}

export interface RevealCuratedItem {
  id: string;
  eventId: string;
  itemType: 'praise_quote' | 'keyword' | 'episode';
  content: string;
  anonymousLabel?: string;
  safeToPresent: boolean;
  approvalStatus: 'draft' | 'approved' | 'rejected';
  sortOrder: number;
  createdAt: string;
}

export interface RevealTimeCapsuleItem {
  id: string;
  userId: string;
  recipientName: string;
  recipientTeam?: string;
  keywords: string[];
  analysis: string;
  letter: string;
  approvalStatus: 'draft' | 'approved' | 'rejected';
  sourceHash: string;
  isSpotlight: boolean;
  generationMethod: 'openai' | 'fallback' | 'manual';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface RevealDrawItem {
  id: string;
  eventId: string;
  roundNumber: number;
  prizeName: string;
  winnerId: string;
  winnerName: string;
  winnerTeam: string;
  poolHash: string;
  poolSize: number;
  selectedIndex: number;
  executedBy: string;
  idempotencyKey: string;
  isVoided: boolean;
  voidReason?: string;
  createdAt: string;
}

export interface RevealAuditLogItem {
  id: string;
  eventId?: string;
  action: string;
  actorId: string;
  actorName?: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface MatePairReveal {
  id: string;
  batchIndex: number;
  observerId: string;
  observerName: string;
  observerTeam: string;
  targetId: string;
  targetName: string;
  targetTeam: string;
  isRevealed: boolean;
  revealedAt?: string;
}

export interface PreflightItem {
  key: string;
  title: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
}

export interface PreflightReport {
  passed: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  evaluatedAt: string;
  items: PreflightItem[];
}
