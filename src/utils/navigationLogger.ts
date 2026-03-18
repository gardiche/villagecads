/**
 * Navigation Logger - Système centralisé de logging pour le debugging des redirections
 */

export type NavigationEventType = 
  | 'route_change'
  | 'redirect_attempt'
  | 'redirect_success'
  | 'redirect_failed'
  | 'auth_state_change'
  | 'protected_route_check'
  | 'session_check'
  | 'localstorage_action';

export interface NavigationLogEntry {
  timestamp: string;
  type: NavigationEventType;
  from?: string;
  to?: string;
  userId?: string;
  isAuthenticated?: boolean;
  action?: string;
  metadata?: Record<string, any>;
  error?: string;
  stack?: string;
}

class NavigationLogger {
  private logs: NavigationLogEntry[] = [];
  private maxLogs = 100;
  private enabled = true;

  constructor() {
    // Activer en développement uniquement
    this.enabled = import.meta.env.DEV || localStorage.getItem('astryd_debug_navigation') === 'true';
  }

  log(entry: Omit<NavigationLogEntry, 'timestamp'>) {
    if (!this.enabled) return;

    const logEntry: NavigationLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(logEntry);

    // Limiter le nombre de logs en mémoire
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Logging console avec formatage
    const logMethod = entry.error ? console.error : console.log;
    const emoji = this.getEmoji(entry.type);
    
    logMethod(
      `${emoji} [Navigation ${entry.type}]`,
      entry.from && entry.to ? `${entry.from} → ${entry.to}` : entry.action || '',
      entry.metadata || ''
    );

    if (entry.error) {
      console.error('Error details:', entry.error);
      if (entry.stack) {
        console.error('Stack:', entry.stack);
      }
    }

    // Sauvegarder dans localStorage pour persistance
    this.saveToStorage();
  }

  private getEmoji(type: NavigationEventType): string {
    const emojiMap: Record<NavigationEventType, string> = {
      route_change: '🧭',
      redirect_attempt: '🔄',
      redirect_success: '✅',
      redirect_failed: '❌',
      auth_state_change: '🔐',
      protected_route_check: '🛡️',
      session_check: '🔍',
      localstorage_action: '💾',
    };
    return emojiMap[type] || '📍';
  }

  getLogs(): NavigationLogEntry[] {
    return [...this.logs];
  }

  getRecentLogs(count: number = 10): NavigationLogEntry[] {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('astryd_navigation_logs');
    console.log('🧹 Navigation logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private saveToStorage() {
    try {
      const recentLogs = this.logs.slice(-50); // Garder seulement les 50 derniers
      localStorage.setItem('astryd_navigation_logs', JSON.stringify(recentLogs));
    } catch (e) {
      console.warn('Failed to save navigation logs to localStorage:', e);
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('astryd_navigation_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.warn('Failed to load navigation logs from localStorage:', e);
    }
  }

  // Méthodes helper pour cas d'usage courants
  logRouteChange(from: string, to: string, metadata?: Record<string, any>) {
    this.log({
      type: 'route_change',
      from,
      to,
      metadata,
    });
  }

  logRedirectAttempt(from: string, to: string, reason: string, metadata?: Record<string, any>) {
    this.log({
      type: 'redirect_attempt',
      from,
      to,
      action: reason,
      metadata,
    });
  }

  logRedirectSuccess(from: string, to: string, metadata?: Record<string, any>) {
    this.log({
      type: 'redirect_success',
      from,
      to,
      metadata,
    });
  }

  logRedirectFailed(from: string, to: string, error: string, metadata?: Record<string, any>) {
    this.log({
      type: 'redirect_failed',
      from,
      to,
      error,
      metadata,
    });
  }

  logAuthStateChange(isAuthenticated: boolean, userId?: string, metadata?: Record<string, any>) {
    this.log({
      type: 'auth_state_change',
      isAuthenticated,
      userId,
      metadata,
    });
  }

  logProtectedRouteCheck(route: string, isAuthenticated: boolean, metadata?: Record<string, any>) {
    this.log({
      type: 'protected_route_check',
      to: route,
      isAuthenticated,
      metadata,
    });
  }

  logSessionCheck(hasSession: boolean, userId?: string, metadata?: Record<string, any>) {
    this.log({
      type: 'session_check',
      isAuthenticated: hasSession,
      userId,
      metadata,
    });
  }

  logLocalStorageAction(action: string, key: string, metadata?: Record<string, any>) {
    this.log({
      type: 'localstorage_action',
      action: `${action}: ${key}`,
      metadata,
    });
  }

  // Debug helper - afficher un résumé
  printSummary() {
    if (!this.enabled) {
      console.log('Navigation logging is disabled. Enable with localStorage.setItem("astryd_debug_navigation", "true")');
      return;
    }

    console.group('📊 Navigation Logs Summary');
    console.log(`Total logs: ${this.logs.length}`);
    
    const byType = this.logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('By type:', byType);
    
    const errors = this.logs.filter(log => log.error);
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} errors detected`);
      errors.forEach(err => {
        console.error(`- ${err.type}: ${err.error}`);
      });
    }
    
    console.log('\nRecent logs (last 10):');
    this.getRecentLogs(10).forEach(log => {
      console.log(`${this.getEmoji(log.type)} ${log.type}: ${log.from || ''} → ${log.to || ''} ${log.action || ''}`);
    });
    
    console.groupEnd();
  }
}

// Instance singleton
export const navigationLogger = new NavigationLogger();

// Charger les logs existants au démarrage
navigationLogger.loadFromStorage();

// Exposer globalement pour debug console
if (typeof window !== 'undefined') {
  (window as any).navigationLogger = navigationLogger;
  console.log('💡 Navigation logger available at window.navigationLogger');
  console.log('💡 Use navigationLogger.printSummary() to see all logs');
  console.log('💡 Use navigationLogger.clearLogs() to clear logs');
}

export default navigationLogger;
