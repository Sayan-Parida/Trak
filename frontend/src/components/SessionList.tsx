import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Star
} from 'lucide-react';
import { Session, SessionStatus } from '../types';
import { apiClient } from '../api/client';
import { researchStore } from '../api/researchStore';

interface Props {
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenNewSessionModal: () => void;
}

export default function SessionList({
  selectedSessionId,
  onSelectSession,
  isCollapsed,
  onToggleCollapse,
  onOpenNewSessionModal
}: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SessionStatus>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSessions();
      setSessions(data);
    } catch (e) {
      console.warn('Error fetching sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const unsubscribe = researchStore.subscribe(() => {
      fetchSessions();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this research session?')) {
      await apiClient.deleteSession(id);
      if (selectedSessionId === id) {
        const remaining = sessions.filter(s => s.id !== id);
        if (remaining.length > 0) onSelectSession(remaining[0].id);
      }
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    apiClient.updateSession(session.id, { favorite: !session.favorite });
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = !searchFilter.trim() || 
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.tags?.some(t => t.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isCollapsed) {
    return (
      <aside 
        className="h-full flex flex-col items-center py-2 border-r transition-all duration-200 z-10 shrink-0 select-none"
        style={{
          width: 44,
          backgroundColor: 'var(--surface-base)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          onClick={onToggleCollapse}
          title="Expand Workspaces (⌘B)"
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] mb-2 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenNewSessionModal}
          title="New Workspace"
          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] mb-3 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-1 px-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              title={session.title}
              className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-mono font-medium transition-colors ${
                selectedSessionId === session.id
                  ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {session.title.slice(0, 2).toUpperCase()}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className="h-full flex flex-col border-r transition-all duration-200 z-10 shrink-0 select-none"
      style={{
        width: 240,
        backgroundColor: 'var(--surface-base)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Sidebar Header */}
      <div 
        className="h-10 px-3 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Workspaces
          </span>
          <span className="text-[10px] font-mono text-[var(--text-faint)]">
            ({sessions.length})
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onOpenNewSessionModal}
            title="New Workspace"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar (⌘B)"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter / Search mini-bar */}
      <div className="p-2 border-b space-y-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded border bg-[var(--surface-subtle)] text-xs"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <Search className="w-3 h-3 text-[var(--text-faint)] shrink-0" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter..."
            className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 text-[10px]">
          {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 py-0.5 rounded text-center transition-colors ${
                statusFilter === st 
                  ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] font-semibold' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {st === 'ALL' ? 'All' : st[0] + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Session Item List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {loading && sessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--text-muted)]">Loading...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-6 px-2 text-xs text-[var(--text-muted)]">
            No sessions found.
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isSelected = selectedSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group px-2.5 py-2 rounded text-left transition-colors cursor-pointer flex flex-col gap-0.5 ${
                  isSelected 
                    ? 'bg-[var(--surface-selected)] text-[var(--text-primary)]' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {/* Title and Favorite / Delete */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: session.status === 'ACTIVE' ? 'var(--status-active)' : 'var(--status-muted)' }}
                    />
                    <span className="text-xs font-medium truncate leading-tight">
                      {session.title}
                    </span>
                  </div>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleFavorite(e, session)}
                      className="p-0.5 text-[var(--text-muted)] hover:text-[var(--status-warning)]"
                    >
                      <Star className={`w-3 h-3 ${session.favorite ? 'fill-[var(--status-warning)] text-[var(--status-warning)]' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      className="p-0.5 text-[var(--text-muted)] hover:text-[var(--status-danger)]"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Minimal Meta */}
                <div className="flex items-center gap-2 pl-3 text-[10px] font-mono text-[var(--text-muted)]">
                  <span>{session.entityCount} nodes</span>
                  <span>•</span>
                  <span>{session.pageCount} sources</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div 
        className="h-8 px-3 border-t text-[10px] font-mono text-[var(--text-faint)] flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span>ResearchMind Desktop</span>
        <button
          onClick={() => {
            if (window.confirm('Reset sample research graphs?')) {
              researchStore.resetToDefault();
            }
          }}
          className="hover:text-[var(--text-primary)]"
        >
          Reset
        </button>
      </div>
    </aside>
  );
}
