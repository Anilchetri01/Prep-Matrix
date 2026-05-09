import type { AIInterviewSession } from '../types';

const STORAGE_KEY_PREFIX = 'ai-interview-simulator:ai-mode-sessions:v1';

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function normalizeSessions(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as AIInterviewSession[];
  }

  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => item as AIInterviewSession)
    .sort((left, right) => right.createdAt - left.createdAt);
}

class AIInterviewLocalStore {
  listSessions(userId: string) {
    if (!isBrowser()) {
      return [] as AIInterviewSession[];
    }

    try {
      const rawValue = window.localStorage.getItem(getStorageKey(userId));
      if (!rawValue) {
        return [] as AIInterviewSession[];
      }

      return normalizeSessions(JSON.parse(rawValue));
    } catch (error) {
      console.warn('[aiInterviewLocalStore] listSessions:error', {
        error,
        userId,
      });
      return [] as AIInterviewSession[];
    }
  }

  getSession(userId: string, sessionId: string) {
    return this.listSessions(userId).find((session) => session.id === sessionId) ?? null;
  }

  saveSession(session: AIInterviewSession) {
    const previousSessions = this.listSessions(session.userId);
    const nextSessions = [
      session,
      ...previousSessions.filter((item) => item.id !== session.id),
    ].sort((left, right) => right.createdAt - left.createdAt);

    this.writeSessions(session.userId, nextSessions);
    return session;
  }

  clearSessions(userId: string) {
    if (!isBrowser()) {
      return;
    }

    try {
      window.localStorage.removeItem(getStorageKey(userId));
    } catch (error) {
      console.warn('[aiInterviewLocalStore] clearSessions:error', {
        error,
        userId,
      });
    }
  }

  deleteSession(userId: string, sessionId: string) {
    const previousSessions = this.listSessions(userId);
    const nextSessions = previousSessions.filter((session) => session.id !== sessionId);
    this.writeSessions(userId, nextSessions);
    return { success: true };
  }

  private writeSessions(userId: string, sessions: AIInterviewSession[]) {
    if (!isBrowser()) {
      return;
    }

    try {
      if (!sessions.length) {
        window.localStorage.removeItem(getStorageKey(userId));
        return;
      }

      window.localStorage.setItem(getStorageKey(userId), JSON.stringify(sessions));
    } catch (error) {
      console.warn('[aiInterviewLocalStore] writeSessions:error', {
        count: sessions.length,
        error,
        userId,
      });
    }
  }
}

export const aiInterviewLocalStore = new AIInterviewLocalStore();
