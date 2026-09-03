import { useEffect, useState, useCallback } from 'react';
import { 
  Plus, 
  Compass, 
  ArrowRight
} from 'lucide-react';
import Navbar from './components/Navbar';
import SessionList from './components/SessionList';
import MindMap from './components/MindMap';
import Timeline from './components/Timeline';
import PagesView from './components/PagesView';
import ResearchSearch from './components/ResearchSearch';
import NewSessionModal from './components/NewSessionModal';
import ShortcutsModal from './components/ShortcutsModal';
import { Theme, Session } from './types';
import { apiClient } from './api/client';
import { researchStore } from './api/researchStore';

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mindmap' | 'timeline' | 'pages'>('mindmap');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('researchmind-theme') as Theme) || 'system');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('researchmind-theme', theme);
  }, [theme]);

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const data = await apiClient.getSessions();
      setSessions(data);
      if (!selectedSessionId && data.length > 0) {
        setSelectedSessionId(data[0].id);
      }
    } catch (e) {
      console.warn('Error loading sessions:', e);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    loadSessions();
    const unsubscribe = researchStore.subscribe(() => {
      loadSessions();
    });
    return () => {
      unsubscribe();
    };
  }, [loadSessions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowNewSessionModal(false);
        setShowShortcutsModal(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans select-none antialiased">
      {/* Compact Collapsible Sidebar */}
      <SessionList
        selectedSessionId={selectedSessionId}
        onSelectSession={setSelectedSessionId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenNewSessionModal={() => setShowNewSessionModal(true)}
      />

      {/* Main App Workspace Shell */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Compact Desktop Top Bar */}
        <Navbar
          activeSession={activeSession}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          theme={theme}
          onChangeTheme={setTheme}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          onOpenNewSession={() => setShowNewSessionModal(true)}
          onFocusSearch={() => setIsSearchOpen(true)}
        />

        {/* Command Search Overlay / Dropdown */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-40 flex items-start justify-center pt-16 bg-black/30 backdrop-blur-xs">
            <div className="w-full max-w-lg p-2">
              <ResearchSearch
                activeSessionId={selectedSessionId}
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onOpenSession={(sId) => {
                  setSelectedSessionId(sId);
                  setActiveTab('mindmap');
                  setIsSearchOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Hero Canvas Area */}
        <div className="flex-1 min-h-0 relative overflow-hidden bg-[var(--graph-bg)]">
          {!selectedSessionId ? (
            /* Quiet Welcome State */
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Compass className="w-5 h-5" />
              </div>

              <div>
                <h1 className="text-base font-bold text-[var(--text-primary)] mb-1">
                  ResearchMind
                </h1>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Interactive knowledge graph workspace for deep literature exploration.
                </p>
              </div>

              <div className="w-full space-y-1.5 pt-2">
                {sessions.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className="w-full p-2.5 rounded border text-left transition-colors hover:bg-[var(--surface-hover)] flex items-center justify-between group"
                    style={{
                      backgroundColor: 'var(--surface-base)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {s.title}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)]">
                        {s.pageCount} sources • {s.entityCount} nodes
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowNewSessionModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Workspace</span>
              </button>
            </div>
          ) : (
            /* Active Views */
            <>
              {activeTab === 'mindmap' && (
                <MindMap sessionId={selectedSessionId} />
              )}
              {activeTab === 'timeline' && (
                <Timeline 
                  sessionId={selectedSessionId} 
                  onJumpToNode={() => setActiveTab('mindmap')}
                />
              )}
              {activeTab === 'pages' && (
                <PagesView sessionId={selectedSessionId} />
              )}
            </>
          )}
        </div>
      </main>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <NewSessionModal
          onClose={() => setShowNewSessionModal(false)}
          onCreated={(newId) => {
            setSelectedSessionId(newId);
            setActiveTab('mindmap');
          }}
        />
      )}

      {/* Shortcuts Guide Modal */}
      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}
