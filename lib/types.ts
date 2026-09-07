export interface User {
  id: string;
  code: string;
  name: string;
  team: string;
  avatar?: string;
  role?: 'admin' | 'user';
}

export interface MateAssignment {
  id: string;
  userId: string;
  targetUserId: string;
  assignedAt: string;
}

export interface PrivateNote {
  id: string;
  userId: string;
  targetUserId: string;
  content: string;
  updatedAt: string;
}

export interface PraiseMessage {
  id: string;
  senderUserId: string; // Stored for admin / system, kept hidden from recipient
  recipientUserId: string;
  recipientName: string;
  recipientTeam?: string;
  content: string;
  refinedContent?: string;
  likes: number;
  likedBy: string[]; // user IDs who liked this message
  createdAt: string;
  isMatePraise?: boolean;
}

export interface TimeCapsule {
  id: string;
  userId: string;
  letterContent: string;
  keywords: string[];
  generatedAt: string;
}

export interface AppState {
  isRevealActive: boolean;
}
