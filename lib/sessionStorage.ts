// Session storage utilities for persistent user sessions
export interface UserSession {
  userId: string;
  playerName: string;
  currentRoomId: string | null;
  isAdmin: boolean;
  lastActivity: number;
}

const SESSION_KEY = 'sequence_game_session';

export const sessionStorage = {
  // Save user session to localStorage
  saveSession: (session: UserSession): void => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  },

  // Load user session from localStorage
  loadSession: (): UserSession | null => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;
      
      const session = JSON.parse(stored);
      
      // Check if session is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - (session.lastActivity || 0) > maxAge) {
        sessionStorage.clearSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.warn('Failed to load session from localStorage:', error);
      return null;
    }
  },

  // Update session with new data
  updateSession: (updates: Partial<UserSession>): void => {
    const currentSession = sessionStorage.loadSession();
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        ...updates,
        lastActivity: Date.now()
      };
      sessionStorage.saveSession(updatedSession);
    }
  },

  // Clear session from localStorage
  clearSession: (): void => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  },

  // Check if user has an active session
  hasActiveSession: (): boolean => {
    const session = sessionStorage.loadSession();
    return session !== null && session.currentRoomId !== null;
  },

  // Generate unique user ID
  generateUserId: (): string => {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  },

  // Debug function to check session status
  debugSession: (): void => {
    const session = sessionStorage.loadSession();
    console.log('🔍 Current session debug:', {
      hasSession: !!session,
      session: session,
      localStorage: localStorage.getItem(SESSION_KEY)
    });
  }
};
