import { User, PrivateNote, PraiseMessage, AISuggestion, ActivityStats } from './types';

const STORAGE_CURRENT_USER_KEY = 'ai_vitamin_session_v1';

// Client-side Session Management with Supabase Live Re-sync
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!item) return null;
    
    const localUser: User = JSON.parse(item);
    if (!localUser || !localUser.code) return localUser;

    // Asynchronous background sync from Supabase (non-blocking for immediate UI response)
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: localUser.code }),
      cache: 'no-store'
    })
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      })
      .catch(() => {});

    return localUser;
  } catch (e) {
    try {
      const item = window.localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
}

export async function setCurrentUser(user: User | null): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      // Store minimal identity: id, code, name, team, role
      const sessionObj = {
        id: user.id,
        code: user.code,
        name: user.name,
        team: user.team,
        avatar: user.avatar,
        role: user.role
      };
      window.localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(sessionObj));
    } else {
      window.localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  } catch (e) {}
}

// Client-side SWR (Stale-While-Revalidate) Cache Store
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds fresh TTL

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  memoryCache.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  });
}

// Supabase API calls via Next.js API Routes

export async function getUserByCode(code: string): Promise<{ user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || '로그인 실패' };
    }
    return { user: data.user };
  } catch (e: any) {
    return { error: e.message || '네트워크 오류가 발생했습니다.' };
  }
}

export async function getAllUsers(): Promise<{ users?: User[]; error?: string }> {
  const cacheKey = 'users:all';
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch('/api/users', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    const result = { users: data.users || [] };
    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (e: any) {
    if (cached) return cached.data;
    return { error: e.message || '유저 목록을 불러오지 못했습니다.' };
  }
}

export async function getMatesForUser(userId: string): Promise<{ mates?: User[]; error?: string }> {
  const cacheKey = `mates:${userId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(`/api/mates?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    const result = { mates: data.mates || [] };
    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (e: any) {
    if (cached) return cached.data;
    return { error: e.message };
  }
}

export async function getNotesForUser(userId: string): Promise<{ notes?: PrivateNote[]; error?: string }> {
  const cacheKey = `notes:${userId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(`/api/notes?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    const result = { notes: data.notes || [] };
    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (e: any) {
    if (cached) return cached.data;
    return { error: e.message };
  }
}

export async function saveNote(userId: string, targetUserId: string, content: string): Promise<{ note?: PrivateNote; error?: string }> {
  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetUserId, content }),
      cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    invalidateCache(`notes:${userId}`);
    return { note: data.note };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getPraises(isAdmin: boolean = false): Promise<{ praises?: PraiseMessage[]; error?: string }> {
  const cacheKey = `praises:${isAdmin}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(`/api/praises${isAdmin ? '?admin=true' : ''}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    const result = { praises: data.praises || [] };
    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (e: any) {
    if (cached) return cached.data;
    return { error: e.message };
  }
}

export async function addPraise(
  senderUserId: string,
  recipientUserId: string,
  recipientName: string,
  recipientTeam: string,
  content: string,
  refinedContent?: string
): Promise<{ praise?: PraiseMessage; error?: string }> {
  try {
    const res = await fetch('/api/praises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderUserId,
        recipientUserId,
        recipientName,
        recipientTeam,
        content,
        refinedContent
      }),
      cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    invalidateCache('praises:');
    return { praise: data.praise };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deletePraiseMessage(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/praises?id=${encodeURIComponent(id)}`, { 
      method: 'DELETE',
      cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    invalidateCache('praises:');
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getIsRevealActive(): Promise<boolean> {
  try {
    const res = await fetch('/api/reveal', { cache: 'no-store' });
    const data = await res.json();
    return Boolean(data.isRevealActive);
  } catch (e) {
    return false;
  }
}

export async function toggleRevealActive(active: boolean): Promise<boolean> {
  try {
    const res = await fetch('/api/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
      cache: 'no-store'
    });
    const data = await res.json();
    return Boolean(data.isRevealActive);
  } catch (e) {
    return false;
  }
}

export async function assignRandomMatesCrossTeam(): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/assign-mates', { 
      method: 'POST',
      cache: 'no-store' 
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    invalidateCache('mates:');
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function seedSupabaseData(): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/seed', { 
      method: 'POST',
      cache: 'no-store' 
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getAISuggestionsList(): Promise<{ suggestions?: AISuggestion[]; error?: string }> {
  try {
    const res = await fetch('/api/suggestions', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    return { suggestions: data.suggestions || [] };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function saveAISuggestionsList(suggestions: AISuggestion[]): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestions }),
      cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getActivityStats(): Promise<{ stats?: ActivityStats; error?: string }> {
  try {
    const res = await fetch('/api/stats', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    return { stats: data.stats };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function setRevealTargetDate(dateStr: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_reveal_date', revealDate: dateStr }),
      cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function incrementWallViewCount(): Promise<void> {
  try {
    await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'increment_wall_view' }),
      cache: 'no-store'
    });
  } catch (e) {}
}
