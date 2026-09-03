import { useEffect, useState } from 'react';
import { 
  Clock, 
  Search, 
  BookOpen, 
  Cpu, 
  Flag, 
  ExternalLink, 
  Focus,
  Loader2
} from 'lucide-react';
import { TimelineEntry } from '../types';
import { apiClient } from '../api/client';
import { researchStore } from '../api/researchStore';

interface Props {
  sessionId: string;
  onJumpToNode?: (nodeId: string) => void;
}

export default function Timeline({ sessionId, onJumpToNode }: Props) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTimeline(sessionId);
      setEntries(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    const unsubscribe = researchStore.subscribe(() => {
      fetchTimeline();
    });
    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  const filteredEntries = entries.filter((e) => {
    if (filterType === 'ALL') return true;
    return e.type === filterType;
  });

  const getEventIcon = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'SEARCH': return <Search className="w-3 h-3 text-[var(--node-search)]" />;
      case 'PAGE_VISIT': return <BookOpen className="w-3 h-3 text-[var(--node-paper)]" />;
      case 'AI_INSIGHT': return <Cpu className="w-3 h-3 text-[var(--node-insight)]" />;
      case 'MILESTONE': return <Flag className="w-3 h-3 text-[var(--node-concept)]" />;
      default: return <Clock className="w-3 h-3 text-[var(--text-muted)]" />;
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-xs text-[var(--text-muted)] font-mono">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
        <span>Loading research stream...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-xs text-[var(--status-danger)]">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto px-6 py-6 select-none">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header & Category Filters */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-xs font-semibold text-[var(--text-primary)]">
            Research Timeline
          </h2>

          <div className="flex items-center gap-1 text-[11px]">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'SEARCH', label: 'Searches' },
              { key: 'PAGE_VISIT', label: 'Sources' },
              { key: 'AI_INSIGHT', label: 'Syntheses' }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterType === f.key
                    ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline List */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-10 text-xs text-[var(--text-muted)]">
            No events recorded.
          </div>
        ) : (
          <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--border-subtle)]">
            {filteredEntries.map((entry) => {
              const eventDate = new Date(entry.timestamp);
              return (
                <div key={entry.id} className="relative group">
                  {/* Status dot */}
                  <div 
                    className="absolute -left-5 top-1.5 w-3 h-3 rounded-full flex items-center justify-center bg-[var(--surface-base)] border border-[var(--border-medium)]"
                  >
                    {getEventIcon(entry.type)}
                  </div>

                  <div 
                    className="p-3 rounded border transition-colors hover:border-[var(--border-medium)]"
                    style={{
                      backgroundColor: 'var(--surface-base)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[var(--text-muted)] mb-1">
                      <span className="uppercase font-semibold tracking-wider">
                        {entry.type.replace('_', ' ')}
                      </span>
                      <time>
                        {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </time>
                    </div>

                    <h3 className="text-xs font-semibold text-[var(--text-primary)] leading-tight mb-1">
                      {entry.title}
                    </h3>

                    {entry.summary && (
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-2">
                        {entry.summary}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-subtle)] text-[10px] font-mono">
                      {entry.url ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
                        >
                          <span>{entry.domain || 'External Resource'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-[var(--text-faint)]">System Event</span>
                      )}

                      {entry.targetNodeId && onJumpToNode && (
                        <button
                          onClick={() => onJumpToNode(entry.targetNodeId!)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-1"
                        >
                          <Focus className="w-2.5 h-2.5" />
                          <span>Graph</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
