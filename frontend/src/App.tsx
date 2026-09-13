import { useEffect, useState, useCallback } from 'react';
import { 
  Plus, 
  Compass, 
  ArrowRight,
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
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('researchmind-theme') as Theme) || 'light');
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
        {/* Desktop Top Bar */}
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
          <div className="fixed inset-0 z-40 flex items-start justify-center pt-16 bg-black/70">
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
          <section className="shrink-0 relative bg-[var(--surface-base)] px-6 lg:px-10 pt-4 pb-4 border-b-2 border-[var(--border-strong)]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {/* Left: RESEARCH SESSION status + title */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="b-tag b-tag--accent">
                    <MapPinned className="w-2.5 h-2.5" />
                    Research session
                  </span>
                  <span
                    className={`b-live ${activeSession.status === 'ACTIVE' ? 'b-live--on' : ''}`}
                    style={{ background: activeSession.status === 'ACTIVE' ? 'var(--status-active)' : 'var(--status-muted)' }}
                  />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {activeSession.status}
                    {activeSession.status === 'ACTIVE' ? ' • live trail' : ''}
                  </span>
                </div>

                <h1 style={{ fontFamily: 'var(--font-display)' }} className="min-w-0 truncate text-xl font-bold leading-none tracking-[-0.02em] text-[var(--text-primary)] sm:text-2xl">
                  {activeSession.title}
                </h1>
              </div>

              {/* Middle: editorial stat blocks centered in the open middle band */}
              <div className="mx-auto flex flex-wrap items-center gap-2">
                <div className="flex flex-col gap-1 border-2 border-[var(--accent)] bg-[var(--accent-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1.5 min-w-[86px]">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">Started</span>
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{formatSessionDate(activeSession.startTime)}</span>
                </div>
                <div className="flex flex-col gap-1 border-2 border-[var(--border-medium)] bg-[var(--surface-elevated)] rounded-[var(--radius-sm)] px-2.5 py-1.5 min-w-[86px]">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">Duration</span>
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{formatSessionDuration(activeSession.startTime, activeSession.endTime)}</span>
                </div>
                <div className="flex flex-col gap-1 border-2 border-[var(--accent-warm)] bg-[var(--accent-warm-subtle)] rounded-[var(--radius-sm)] px-2.5 py-1.5 min-w-[86px]">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">Searches</span>
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{activeSession.searchCount}</span>
                </div>
                <div className="flex flex-col gap-1 border-2 border-[var(--node-page)] bg-[var(--node-page-bg)] rounded-[var(--radius-sm)] px-2.5 py-1.5 min-w-[86px]">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">Pages</span>
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{activeSession.pageCount}</span>
                </div>
              </div>

              {/* Right: LAST KNOWN ACTIVITY pinned upper-right */}
              <div className="hidden shrink-0 lg:block">
                <div className="b-panel max-w-52 px-3.5 py-3 text-right">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    Last known activity
                  </div>
                  <div className="mt-1.5 font-display text-sm font-bold text-[var(--text-primary)]">
                    {activeSession.endTime ? formatSessionDate(activeSession.endTime) : 'Research in progress'}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                    {activeSession.endTime ? 'Session stopped here' : 'Trail is still active'}
                  </div>
                </div>
              </div>
            </div>
            {/* Stripe accent above the bottom rule */}
            <div className="stripes-accent absolute bottom-0 left-0 right-0 h-[5px]" />
          </section>
        )}

        {/* Hero Canvas Area */}
        <div className="flex-1 min-h-0 relative overflow-hidden bg-[var(--graph-bg)]">
          {!selectedSessionId ? (
            /* Welcome State */
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-5">
              <div 
                className="relative w-14 h-14 flex items-center justify-center border-2 border-[var(--border-strong)] shadow-[4px_4px_0_var(--shadow-ink)]"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Compass className="w-6 h-6 text-[var(--surface-base)]" />
                <span className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-[var(--accent-yellow)] border-2 border-[var(--border-strong)]" />
              </div>

              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  Pariet — Research Mind
                </h1>
                <p className="text-xs font-mono text-[var(--text-secondary)] tracking-wide">
                  Interactive knowledge graph workspace for deep literature exploration.
                </p>
              </div>

              <div className="w-full pt-1 border-t-2 border-dashed border-[var(--border-medium)]">
                <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-faint)] mb-2 text-left">
                  Recent sessions
                </div>
                <div className="w-full space-y-2">
                  {sessions.slice(0, 4).map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className="group w-full border-2 border-[var(--border-subtle)] bg-[var(--surface-base)] rounded-[var(--radius-sm)] text-left transition-all hover:border-[var(--border-strong)] hover:shadow-[3px_3px_0_var(--shadow-ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] flex items-center justify-between gap-3 p-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="b-stamp">{String(i + 1).padStart(2, '0')}</span>
                        <div className="min-w-0 text-left">
                          <div className="font-display text-[13px] font-bold text-[var(--text-primary)] truncate">
                            {s.title}
                          </div>
                          <div className="font-mono text-[10px] font-bold text-[var(--text-muted)]">
                            P {s.pageCount} • {s.status}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--text-primary)] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowNewSessionModal(true)}
                className="b-btn b-btn--accent text-sm px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Workspace</span>
              </button>
            </div>
          ) : (
            /* Active Views */
            <div key={activeTab} className="view-enter w-full h-full">
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
            </div>
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
