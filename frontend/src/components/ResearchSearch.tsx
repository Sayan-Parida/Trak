import { useState, useRef, useEffect, FormEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { loadSessionData, searchSession, SessionSearchResults } from '../utils/sessionSearch';

interface Props {
  activeSessionId?: string | null;
  onFocusNode?: (nodeId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export default function ResearchSearch({ activeSessionId, onFocusNode, isOpen = false, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SessionSearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (onClose) onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q || !activeSessionId) return;

    setLoading(true);
    setResults(null);
    try {
      const { pages, searches } = await loadSessionData(activeSessionId);
      setResults(searchSession(activeSessionId, q, pages, searches));
    } catch {
      setResults({ sessionId: activeSessionId, pages: [], searches: [], totalMatches: 0 });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
  };

  const canSearch = !!activeSessionId;

  return (
    <div ref={containerRef} className="relative z-20">
      <form onSubmit={onSubmit} className="relative flex items-center">
        <div
          className="flex items-center gap-2 px-3 h-9 rounded-[var(--radius-sm)] border transition-colors w-full sm:w-80 md:w-96"
          style={{
            backgroundColor: 'var(--surface-subtle)',
            borderColor: loading ? 'var(--border-focus)' : 'var(--border-subtle)',
          }}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setResults(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.defaultPrevented) {
                e.preventDefault();
                handleSearch(query);
              }
            }}
            placeholder={canSearch ? 'Search this session...' : 'Open a session to search'}
            disabled={!canSearch}
            className="flex-1 min-w-0 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          />

          {query && !loading && (
            <button type="button" onClick={handleClear} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !query.trim() || !canSearch}
            className="b-btn px-2.5 py-1 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'RUN'}
          </button>
        </div>
      </form>

      {/* Dropdown */}
      <div
        className="absolute left-0 top-full mt-2 w-full sm:w-[28rem] rounded-[var(--radius-md)] border p-1.5 z-30 shadow-panel text-sm"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border-medium)',
          maxHeight: '360px',
          overflowY: 'auto',
        }}
      >
        {/* No active session */}
        {!activeSessionId && (
          <div className="py-4 text-center font-mono text-[10px] text-[var(--text-muted)]">
            Open a research session to search.
          </div>
        )}

        {/* Loading */}
        {activeSessionId && loading && (
          <div className="py-4 text-center font-mono text-[10px] text-[var(--text-muted)]">
            Searching&hellip;
          </div>
        )}

        {/* Neutral: session is open, nothing typed yet */}
        {activeSessionId && !loading && !results && !query.trim() && (
          <div className="py-4 text-center font-mono text-[10px] text-[var(--text-muted)]">
            Search this session&rsquo;s pages and queries.
          </div>
        )}

        {/* Hint to run */}
        {activeSessionId && !loading && !results && query.trim() && (
          <div className="py-4 text-center font-mono text-[10px] text-[var(--text-muted)]">
            Press <span className="font-bold text-[var(--text-secondary)]">RUN</span> or{' '}
            <span className="font-bold text-[var(--text-secondary)]">Enter</span> to search.
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
              <span>
                <span className="font-bold text-[var(--text-secondary)]">{results.totalMatches}</span> matches
              </span>
              <button onClick={handleClear} className="hover:text-[var(--text-primary)]">
                Clear
              </button>
            </div>

            {results.totalMatches === 0 && (
              <div className="py-4 text-center font-mono text-[10px] text-[var(--text-muted)]">
                No matches in this research session.
              </div>
            )}

            {/* Pages */}
            {results.pages.length > 0 && (
              <Section title="PAGES" count={results.pages.length}>
                {results.pages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => window.open(p.url, '_blank', 'noopener,noreferrer')}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="font-medium text-[11px] text-[var(--text-primary)] leading-tight truncate">
                      {p.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] text-[var(--text-muted)]">
                      {p.domain && <span>{p.domain}</span>}
                    </div>
                  </button>
                ))}
              </Section>
            )}

            {/* Searches */}
            {results.searches.length > 0 && (
              <Section title="SEARCHES" count={results.searches.length}>
                {results.searches.map((sq) => (
                  <button
                    key={sq.id}
                    type="button"
                    onClick={() => {
                      if (onFocusNode) onFocusNode(sq.id);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="font-medium text-[11px] text-[var(--text-primary)] leading-tight truncate">
                      &ldquo;{sq.queryText}&rdquo;
                    </div>
                    <div className="mt-0.5 font-mono text-[9px] text-[var(--text-muted)]">
                      {formatDate(sq.timestamp)}
                    </div>
                  </button>
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold border-b border-[var(--border-subtle)]">
        {title}
        <span className="ml-1 text-[var(--text-faint)]">({count})</span>
      </div>
      {children}
    </div>
  );
}