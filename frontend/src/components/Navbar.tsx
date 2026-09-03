import { useState, useRef, useEffect } from 'react';
import { 
  Network, 
  Clock, 
  BookOpen, 
  Sun, 
  Moon, 
  Monitor, 
  Plus, 
  Settings, 
  Search,
  Check,
  Compass
} from 'lucide-react';
import { Theme, Session } from '../types';

interface Props {
  activeSession: Session | undefined;
  activeTab: 'mindmap' | 'timeline' | 'pages';
  onChangeTab: (tab: 'mindmap' | 'timeline' | 'pages') => void;
  theme: Theme;
  onChangeTheme: (theme: Theme) => void;
  onOpenShortcuts: () => void;
  onOpenNewSession: () => void;
  onFocusSearch: () => void;
}

export default function Navbar({
  activeSession,
  activeTab,
  onChangeTab,
  theme,
  onChangeTheme,
  onOpenShortcuts,
  onOpenNewSession,
  onFocusSearch
}: Props) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      className="flex items-center justify-between px-3 h-10 border-b z-30 select-none shrink-0"
      style={{
        backgroundColor: 'var(--surface-base)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Left: Brand & Session Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <div 
            className="w-5 h-5 rounded flex items-center justify-center text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Compass className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-[var(--text-primary)]">
            ResearchMind
          </span>
        </div>

        {activeSession && (
          <>
            <span className="text-[var(--text-faint)] text-xs">/</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs text-[var(--text-secondary)] font-medium truncate max-w-[200px] sm:max-w-[280px]">
                {activeSession.title}
              </span>
              <span 
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: activeSession.status === 'ACTIVE' ? 'var(--status-active)' : 'var(--status-muted)' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Center: Clean View Tabs */}
      {activeSession && (
        <nav className="flex items-center gap-1">
          <button
            onClick={() => onChangeTab('mindmap')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'mindmap'
                ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Network className="w-3.5 h-3.5 opacity-70" />
            <span>Research Map</span>
          </button>

          <button
            onClick={() => onChangeTab('timeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'timeline'
                ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 opacity-70" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => onChangeTab('pages')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'pages'
                ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 opacity-70" />
            <span>Sources ({activeSession.pageCount})</span>
          </button>
        </nav>
      )}

      {/* Right: Quick Search Button & Settings Menu */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onFocusSearch}
          className="flex items-center gap-2 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-colors"
          title="Search or research (⌘K)"
        >
          <Search className="w-3 h-3" />
          <span className="hidden sm:inline text-[11px]">Command</span>
          <kbd className="font-mono text-[10px] text-[var(--text-faint)] bg-[var(--surface-subtle)] px-1 rounded">⌘K</kbd>
        </button>

        <button
          onClick={onOpenNewSession}
          className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          title="New Workspace"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Settings & Appearance Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`p-1 rounded transition-colors ${
              showSettingsMenu
                ? 'bg-[var(--surface-selected)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
            title="Settings & Appearance"
          >
            <Settings className="w-4 h-4" />
          </button>

          {showSettingsMenu && (
            <div 
              className="absolute right-0 mt-1 w-44 rounded-lg p-1 z-40 border text-xs shadow-md"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderColor: 'var(--border-medium)',
              }}
            >
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Appearance
              </div>

              <button
                onClick={() => { onChangeTheme('light'); setShowSettingsMenu(false); }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] text-left"
              >
                <span className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 opacity-70" />
                  <span>Light</span>
                </span>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
              </button>

              <button
                onClick={() => { onChangeTheme('dark'); setShowSettingsMenu(false); }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] text-left"
              >
                <span className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 opacity-70" />
                  <span>Dark</span>
                </span>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
              </button>

              <button
                onClick={() => { onChangeTheme('system'); setShowSettingsMenu(false); }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] text-left"
              >
                <span className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 opacity-70" />
                  <span>System</span>
                </span>
                {theme === 'system' && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
              </button>

              <div className="my-1 border-t border-[var(--border-subtle)]" />

              <button
                onClick={() => { onOpenShortcuts(); setShowSettingsMenu(false); }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] text-left text-[var(--text-secondary)]"
              >
                <span>Shortcuts Guide</span>
                <kbd className="font-mono text-[10px] text-[var(--text-faint)]">?</kbd>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
