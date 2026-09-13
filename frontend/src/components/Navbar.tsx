import { useState, useRef, useEffect } from 'react';
import { shortcutLabel } from '../utils/platform';
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
  Check
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
      className="flex items-center justify-between gap-4 px-4 h-14 border-b-2 z-30 select-none shrink-0"
      style={{
        backgroundColor: 'var(--surface-base)',
        borderColor: 'var(--border-strong)',
      }}
    >
      {/* Left: Brand & Session Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div 
            className="relative w-7 h-7 flex items-center justify-center text-[var(--surface-base)]"
            style={{ backgroundColor: 'var(--border-strong)' }}
          >
            <span className="font-display text-sm font-bold leading-none">{'P'}</span>
            <span 
              className="absolute -top-[3px] -right-[3px] w-2 h-2"
              style={{ backgroundColor: 'var(--accent)' }}
            />
          </div>
          <span className="font-display text-base font-bold tracking-tight leading-none text-[var(--text-primary)]">
            Pariet
          </span>
          <span className="hidden md:inline-flex font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)] border-[1.5px] border-[var(--border-medium)] px-1 py-0.5 rounded-[var(--radius-xs)]">
            ResearchLab
          </span>
        </div>

        {activeSession && (
          <>
            <span className="text-[var(--text-faint)] font-bold text-lg leading-none select-none">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-[0.06em] hidden lg:inline">
                SESSION
              </span>
              <span className="text-[13px] text-[var(--text-secondary)] font-semibold truncate max-w-[140px] sm:max-w-[220px]">
                {activeSession.title}
              </span>
              <span 
                className={`b-live shrink-0 ${activeSession.status === 'ACTIVE' ? 'b-live--on' : ''}`}
              />
            </div>
          </>
        )}
      </div>

      {/* Center: View Tabs — three separate brutal boxes */}
      {activeSession && (
        <nav className="flex items-center gap-3">
          <button
            onClick={() => onChangeTab('mindmap')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-xs)] text-sm font-semibold border-2 transition-all ${
              activeTab === 'mindmap'
                ? 'bg-[var(--accent-yellow)] text-[var(--ink)] border-[var(--border-strong)] shadow-[3px_3px_0_var(--shadow-ink)]'
                : 'bg-[var(--surface-base)] text-[var(--text-muted)] border-[var(--border-medium)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:shadow-[2px_2px_0_var(--shadow-ink)] hover:-translate-x-[1px] hover:-translate-y-[1px]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Research Map</span>
          </button>

          <button
            onClick={() => onChangeTab('timeline')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-xs)] text-sm font-semibold border-2 transition-all ${
              activeTab === 'timeline'
                ? 'bg-[var(--accent-yellow)] text-[var(--ink)] border-[var(--border-strong)] shadow-[3px_3px_0_var(--shadow-ink)]'
                : 'bg-[var(--surface-base)] text-[var(--text-muted)] border-[var(--border-medium)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:shadow-[2px_2px_0_var(--shadow-ink)] hover:-translate-x-[1px] hover:-translate-y-[1px]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => onChangeTab('pages')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-xs)] text-sm font-semibold border-2 transition-all ${
              activeTab === 'pages'
                ? 'bg-[var(--accent-yellow)] text-[var(--ink)] border-[var(--border-strong)] shadow-[3px_3px_0_var(--shadow-ink)]'
                : 'bg-[var(--surface-base)] text-[var(--text-muted)] border-[var(--border-medium)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:shadow-[2px_2px_0_var(--shadow-ink)] hover:-translate-x-[1px] hover:-translate-y-[1px]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Sources ({activeSession.pageCount})</span>
          </button>
        </nav>
      )}

      {/* Right: Command, New, Settings */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onFocusSearch}
          className="b-btn text-xs"
          title={`Search or research (${shortcutLabel('K')})`}
        >
          <Search className="w-3 h-3" />
          <span className="hidden sm:inline text-[11px]">Command</span>
          <kbd className="font-mono text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-subtle)] border border-[var(--border-medium)] px-1 rounded-[var(--radius-xs)]">{shortcutLabel('K')}</kbd>
        </button>

        <button
          onClick={onOpenNewSession}
          className="b-btn b-btn--accent text-xs"
          title="New Workspace"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">New</span>
        </button>

        {/* Settings & Appearance Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`b-btn b-btn--square ${showSettingsMenu ? 'bg-[var(--surface-selected)]' : ''}`}
            title="Settings & Appearance"
          >
            <Settings className="w-4 h-4" />
          </button>

          {showSettingsMenu && (
            <div className="b-panel absolute right-0 mt-2 w-48 p-1.5 z-40 text-xs">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold border-b-2 border-[var(--border-subtle)] mb-1">
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

              <div className="my-1 border-t-2 border-[var(--border-subtle)]" />

              <button
                onClick={() => { onOpenShortcuts(); setShowSettingsMenu(false); }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] text-left text-[var(--text-secondary)]"
              >
                <span>Shortcuts Guide</span>
                <kbd className="font-mono text-[10px] font-bold text-[var(--text-faint)] border border-[var(--border-medium)] px-1.5 rounded-[var(--radius-xs)]">?</kbd>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
