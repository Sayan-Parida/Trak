import { useEffect, useState, useCallback } from 'react';
import { 
  Plus, 
  Compass, 
  ArrowRight,
  CalendarDays,
  Clock3,
  Search,
  BookOpen,
  Globe2,
  MapPinned
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

const formatSessionDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}).format(new Date(value));

const formatSessionDuration = (startTime: string, endTime: string | null) => {
  if (!endTime) return 'In progress';
  const minutes = Math.max(1, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mindmap' | 'timeline' | 'pages'>('mindmap');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('researchmind-theme') as Theme) || 'system');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

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
      <main className="relative flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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
                  setFocusNodeId(null);
                }}
                onFocusNode={(nodeId) => {
                  setFocusNodeId(nodeId);
                  setIsSearchOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {activeSession && (
          <section className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--surface-base)] px-6 py-6 lg:px-8">
            <div className="mx-auto flex max-w-[1500px] items-end justify-between gap-6">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--accent)]">
                  <MapPinned className="h-3.5 w-3.5" />
                  <span>Research session</span>
                  <span className="h-1 w-1 rounded-full bg-[var(--status-active)]" />
                  <span className="text-[var(--text-muted)]">{activeSession.status.toLowerCase()}</span>
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)' }} className="max-w-4xl truncate text-3xl leading-[0.98] tracking-[-0.025em] text-[var(--text-primary)] sm:text-4xl">
                  {activeSession.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-[var(--node-page)]" />{formatSessionDate(activeSession.startTime)}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3 w-3 text-[var(--node-concept)]" />{formatSessionDuration(activeSession.startTime, activeSession.endTime)}</span>
                  <span className="inline-flex items-center gap-1.5"><Search className="h-3 w-3 text-[var(--node-search)]" />{activeSession.searchCount} searches</span>
                  <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3 w-3 text-[var(--node-paper)]" />{activeSession.pageCount} pages</span>
                  <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3 w-3 text-[var(--text-secondary)]" />{activeSession.entityCount} entities</span>
                </div>
              </div>
              <div className="hidden max-w-52 shrink-0 border-l border-[var(--border-subtle)] pl-5 text-right lg:block">
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-faint)]">Last known activity</div>
                <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                  {activeSession.endTime ? formatSessionDate(activeSession.endTime) : 'Research in progress'}
                </div>
                <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {activeSession.endTime ? 'Session stopped here' : 'Trail is still active'}
                </div>
              </div>
            </div>
          </section>
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
                <MindMap sessionId={selectedSessionId} focusNodeId={focusNodeId} />
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
