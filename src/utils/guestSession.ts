import { v4 as uuidv4 } from 'uuid';

export const GUEST_SESSION_KEY = 'guest_session_id';
export const GUEST_SELECTED_MESSAGE_KEY = 'guest_selected_message';

export interface GuestSessionData {
  sessionId: string;
  userProfile?: any;
  userSummary?: any;
  guestContact?: any;
  generatedMessages?: any;
  selectedMessage?: string;
  selectedVersion?: string;
}

export class GuestSessionManager {
  private static instance: GuestSessionManager;
  private sessionId: string | null = null;

  private constructor() {
    this.initializeSession();
  }

  public static getInstance(): GuestSessionManager {
    if (!GuestSessionManager.instance) {
      GuestSessionManager.instance = new GuestSessionManager();
    }
    return GuestSessionManager.instance;
  }

  private initializeSession(): void {
    const existingSessionId = localStorage.getItem(GUEST_SESSION_KEY);
    if (existingSessionId) {
      this.sessionId = existingSessionId;
    } else {
      this.sessionId = uuidv4();
      localStorage.setItem(GUEST_SESSION_KEY, this.sessionId);
    }
  }

  public getSessionId(): string {
    if (!this.sessionId) {
      this.initializeSession();
    }
    return this.sessionId!;
  }

  public getSelectedMessage(): { message: string; version: string } | null {
    try {
      const savedMessage = localStorage.getItem(GUEST_SELECTED_MESSAGE_KEY);
      if (savedMessage) {
        const parsed = JSON.parse(savedMessage);
        if (parsed.sessionId === this.sessionId) {
          return {
            message: parsed.message,
            version: parsed.version,
          };
        }
      }
    } catch (error) {
      console.error('Error parsing saved message:', error);
    }
    return null;
  }

  public setSelectedMessage(message: string, version: string): void {
    const data = {
      message,
      version,
      sessionId: this.sessionId,
    };
    localStorage.setItem(GUEST_SELECTED_MESSAGE_KEY, JSON.stringify(data));
  }

  public clearSession(): void {
    localStorage.removeItem(GUEST_SESSION_KEY);
    localStorage.removeItem(GUEST_SELECTED_MESSAGE_KEY);
    this.sessionId = null;
  }

  public hasActiveSession(): boolean {
    return !!this.sessionId && !!localStorage.getItem(GUEST_SESSION_KEY);
  }

  public getSessionData(): GuestSessionData {
    return {
      sessionId: this.getSessionId(),
      selectedMessage: this.getSelectedMessage()?.message,
      selectedVersion: this.getSelectedMessage()?.version,
    };
  }
}

// Export singleton instance
export const guestSessionManager = GuestSessionManager.getInstance();
