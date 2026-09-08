import { User, PrivateNote, PraiseMessage } from './types';

const STORAGE_CURRENT_USER_KEY = 'ai_vitamin_session_v1';

// Client-side Session Management (only minimal login identity in browser)
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
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

// Supabase API calls via Next.js API Routes

export async function getUserByCode(code: string): Promise<{ user?: User; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
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
  try {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { users: data.users || [] };
  } catch (e: any) {
    return { error: e.message || '유저 목록을 불러오지 못했습니다.' };
  }
}

export async function getMatesForUser(userId: string): Promise<{ mates?: User[]; error?: string }> {
  try {
    const res = await fetch(`/api/mates?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { mates: data.mates || [] };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getNotesForUser(userId: string): Promise<{ notes?: PrivateNote[]; error?: string }> {
  try {
    const res = await fetch(`/api/notes?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { notes: data.notes || [] };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function saveNote(userId: string, targetUserId: string, content: string): Promise<{ note?: PrivateNote; error?: string }> {
  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetUserId, content })
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { note: data.note };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getPraises(isAdmin: boolean = false): Promise<{ praises?: PraiseMessage[]; error?: string }> {
  try {
    const res = await fetch(`/api/praises${isAdmin ? '?admin=true' : ''}`);
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { praises: data.praises || [] };
  } catch (e: any) {
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
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { praise: data.praise };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deletePraiseMessage(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/praises?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function getIsRevealActive(): Promise<boolean> {
  try {
    const res = await fetch('/api/reveal');
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
      body: JSON.stringify({ active })
    });
    const data = await res.json();
    return Boolean(data.isRevealActive);
  } catch (e) {
    return false;
  }
}

export async function assignRandomMatesCrossTeam(): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/assign-mates', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function seedSupabaseData(): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/seed', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error };
    }
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
