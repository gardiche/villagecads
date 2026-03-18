import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { navigationLogger } from '@/utils/navigationLogger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bug, Download, Trash2 } from 'lucide-react';

/**
 * NavigationDebugger - Composant de debugging pour visualiser les logs de navigation
 * Affiche un panneau flottant en mode développement
 */
export const NavigationDebugger = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(navigationLogger.getLogs());
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Ne pas afficher en production
  const isDev = import.meta.env.DEV || localStorage.getItem('astryd_debug_navigation') === 'true';
  
  if (!isDev) return null;

  useEffect(() => {
    // Tracker les changements de route
    navigationLogger.logRouteChange(
      document.referrer || 'direct',
      location.pathname + location.search,
      { state: location.state }
    );
    
    // Rafraîchir l'affichage des logs
    setLogs(navigationLogger.getLogs());
  }, [location]);

  useEffect(() => {
    // Tracker l'état d'authentification
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user?.id || null);
      
      navigationLogger.logSessionCheck(
        !!session,
        session?.user?.id,
        { email: session?.user?.email }
      );
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user?.id || null);
      navigationLogger.logAuthStateChange(
        !!session,
        session?.user?.id,
        { event, email: session?.user?.email }
      );
      setLogs(navigationLogger.getLogs());
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDownloadLogs = () => {
    const logsJson = navigationLogger.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astryd-navigation-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    navigationLogger.clearLogs();
    setLogs([]);
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      route_change: 'bg-blue-500',
      redirect_attempt: 'bg-yellow-500',
      redirect_success: 'bg-green-500',
      redirect_failed: 'bg-red-500',
      auth_state_change: 'bg-purple-500',
      protected_route_check: 'bg-orange-500',
      session_check: 'bg-cyan-500',
      localstorage_action: 'bg-gray-500',
    };
    return colorMap[type] || 'bg-gray-500';
  };

  return (
    <>
      {/* Bouton flottant pour ouvrir le debugger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
          title="Open Navigation Debugger"
        >
          <Bug className="w-5 h-5" />
        </button>
      )}

      {/* Panneau de debugging */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] overflow-hidden flex flex-col shadow-2xl border-2 border-red-500">
          <div className="p-4 bg-red-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              <h3 className="font-bold">Navigation Debugger</h3>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 border-b bg-muted/50">
            <div className="space-y-2 text-sm">
              <div>
                <strong>Current Route:</strong> {location.pathname + location.search}
              </div>
              <div>
                <strong>User ID:</strong> {currentUser || 'Not authenticated'}
              </div>
              <div>
                <strong>Total Logs:</strong> {logs.length}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadLogs}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearLogs}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No navigation logs yet
              </div>
            ) : (
              logs.slice().reverse().map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-xs space-y-1 ${
                    log.error ? 'bg-red-100 border border-red-300' : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={`${getTypeColor(log.type)} text-white`}>
                      {log.type}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {log.from && log.to && (
                    <div className="font-mono">
                      {log.from} → {log.to}
                    </div>
                  )}
                  
                  {log.action && (
                    <div className="text-muted-foreground">
                      {log.action}
                    </div>
                  )}
                  
                  {log.error && (
                    <div className="text-red-600 font-semibold">
                      ❌ {log.error}
                    </div>
                  )}
                  
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Metadata
                      </summary>
                      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </>
  );
};

export default NavigationDebugger;
