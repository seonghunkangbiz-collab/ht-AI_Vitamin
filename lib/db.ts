import { User, MateAssignment, PrivateNote, PraiseMessage, TimeCapsule } from './types';
import { INITIAL_USERS, INITIAL_MATE_ASSIGNMENTS, INITIAL_PRAISES, INITIAL_NOTES } from './seedData';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local storage keys
const STORAGE_USERS_KEY = 'ai_vitamin_users_v1';
const STORAGE_MATES_KEY = 'ai_vitamin_mates_v1';
const STORAGE_PRAISES_KEY = 'ai_vitamin_praises_v1';
const STORAGE_NOTES_KEY = 'ai_vitamin_notes_v1';
const STORAGE_REVEAL_KEY = 'ai_vitamin_reveal_active_v1';
const STORAGE_CURRENT_USER_KEY = 'ai_vitamin_current_user_v1';

// Helper to get window localStorage safely
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

// Initialize seed data into localStorage if empty
export function initLocalData() {
  if (typeof window === 'undefined') return;
  if (!window.localStorage.getItem(STORAGE_USERS_KEY)) {
    setStored(STORAGE_USERS_KEY, INITIAL_USERS);
  }
  if (!window.localStorage.getItem(STORAGE_MATES_KEY)) {
    setStored(STORAGE_MATES_KEY, INITIAL_MATE_ASSIGNMENTS);
  }
  if (!window.localStorage.getItem(STORAGE_PRAISES_KEY)) {
    setStored(STORAGE_PRAISES_KEY, INITIAL_PRAISES);
  }
  if (!window.localStorage.getItem(STORAGE_NOTES_KEY)) {
    setStored(STORAGE_NOTES_KEY, INITIAL_NOTES);
  }
  if (window.localStorage.getItem(STORAGE_REVEAL_KEY) === null) {
    setStored(STORAGE_REVEAL_KEY, false);
  }
}

// User Operations
export async function getAllUsers(): Promise<User[]> {
  initLocalData();
  return getStored<User[]>(STORAGE_USERS_KEY, INITIAL_USERS);
}

export async function getUserByCode(code: string): Promise<User | null> {
  const users = await getAllUsers();
  const normalized = code.trim().toUpperCase();
  return users.find(u => u.code.toUpperCase() === normalized) || null;
}

export async function getCurrentUser(): Promise<User | null> {
  initLocalData();
  return getStored<User | null>(STORAGE_CURRENT_USER_KEY, null);
}

export async function setCurrentUser(user: User | null): Promise<void> {
  setStored(STORAGE_CURRENT_USER_KEY, user);
}

// Mystery Mate Operations
export async function getMatesForUser(userId: string): Promise<User[]> {
  initLocalData();
  const assignments = getStored<MateAssignment[]>(STORAGE_MATES_KEY, INITIAL_MATE_ASSIGNMENTS);
  const users = await getAllUsers();
  
  const userAssignments = assignments.filter(a => a.userId === userId);
  const mateIds = userAssignments.map(a => a.targetUserId);
  return users.filter(u => mateIds.includes(u.id));
}

// Private Notes Operations
export async function getNotesForUser(userId: string): Promise<PrivateNote[]> {
  initLocalData();
  const notes = getStored<PrivateNote[]>(STORAGE_NOTES_KEY, INITIAL_NOTES);
  return notes.filter(n => n.userId === userId);
}

export async function saveNote(userId: string, targetUserId: string, content: string): Promise<PrivateNote> {
  initLocalData();
  const notes = getStored<PrivateNote[]>(STORAGE_NOTES_KEY, INITIAL_NOTES);
  const existingIdx = notes.findIndex(n => n.userId === userId && n.targetUserId === targetUserId);
  
  const now = new Date().toISOString();
  let updatedNote: PrivateNote;

  if (existingIdx >= 0) {
    notes[existingIdx] = {
      ...notes[existingIdx],
      content,
      updatedAt: now
    };
    updatedNote = notes[existingIdx];
  } else {
    updatedNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      targetUserId,
      content,
      updatedAt: now
    };
    notes.push(updatedNote);
  }

  setStored(STORAGE_NOTES_KEY, notes);
  return updatedNote;
}

// Praise Messages Operations
export async function getPraises(): Promise<PraiseMessage[]> {
  initLocalData();
  return getStored<PraiseMessage[]>(STORAGE_PRAISES_KEY, INITIAL_PRAISES);
}

export async function addPraise(
  senderUserId: string,
  recipientUserId: string,
  recipientName: string,
  recipientTeam: string,
  content: string,
  refinedContent?: string
): Promise<PraiseMessage> {
  initLocalData();
  const praises = getStored<PraiseMessage[]>(STORAGE_PRAISES_KEY, INITIAL_PRAISES);
  const mates = await getMatesForUser(senderUserId);
  const isMate = mates.some(m => m.id === recipientUserId);

  const newPraise: PraiseMessage = {
    id: `praise-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    senderUserId,
    recipientUserId,
    recipientName,
    recipientTeam,
    content,
    refinedContent: refinedContent || content,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
    isMatePraise: isMate
  };

  praises.unshift(newPraise);
  setStored(STORAGE_PRAISES_KEY, praises);
  return newPraise;
}

export async function togglePraiseLike(praiseId: string, userId: string): Promise<PraiseMessage | null> {
  initLocalData();
  const praises = getStored<PraiseMessage[]>(STORAGE_PRAISES_KEY, INITIAL_PRAISES);
  const idx = praises.findIndex(p => p.id === praiseId);
  if (idx === -1) return null;

  const praise = praises[idx];
  const likedBy = praise.likedBy || [];
  const alreadyLiked = likedBy.includes(userId);

  let newLikedBy: string[];
  let newLikes: number;

  if (alreadyLiked) {
    newLikedBy = likedBy.filter(id => id !== userId);
    newLikes = Math.max(0, praise.likes - 1);
  } else {
    newLikedBy = [...likedBy, userId];
    newLikes = praise.likes + 1;
  }

  praises[idx] = {
    ...praise,
    likes: newLikes,
    likedBy: newLikedBy
  };

  setStored(STORAGE_PRAISES_KEY, praises);
  return praises[idx];
}

// Reveal State & Admin Operations
export async function getIsRevealActive(): Promise<boolean> {
  initLocalData();
  return getStored<boolean>(STORAGE_REVEAL_KEY, false);
}

export async function toggleRevealActive(active: boolean): Promise<boolean> {
  initLocalData();
  setStored(STORAGE_REVEAL_KEY, active);
  return active;
}

// Cross-Team Random Mystery Mate Assignment Algorithm (2 mates per user)
export async function assignRandomMatesCrossTeam(): Promise<MateAssignment[]> {
  initLocalData();
  const users = (await getAllUsers()).filter(u => u.role !== 'admin');
  const newAssignments: MateAssignment[] = [];
  const now = new Date().toISOString();

  users.forEach((user) => {
    // Other users from different teams
    let candidates = users.filter(u => u.id !== user.id && u.team !== user.team);
    // If not enough cross-team candidates, fallback to any other user
    if (candidates.length < 2) {
      candidates = users.filter(u => u.id !== user.id);
    }
    
    // Shuffle candidates
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 2);

    selected.forEach(target => {
      newAssignments.push({
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: user.id,
        targetUserId: target.id,
        assignedAt: now
      });
    });
  });

  setStored(STORAGE_MATES_KEY, newAssignments);
  return newAssignments;
}
