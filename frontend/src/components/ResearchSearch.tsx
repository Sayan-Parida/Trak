import { useState, useRef, useEffect, FormEvent } from 'react';
import { 
  Search, 
  X, 
  Loader2, 
  ChevronRight
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ResearchSearchData } from '../types';
import { SUGGESTED_QUERIES } from '../api/mockData';

interface Props {
  activeSessionId?: string | null;
  onOpenSession: (sessionId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ResearchSearch({ activeSessionId, onOpenSession, isOpen = false, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<ResearchSearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
        setShowDropdown(false);
        if (onClose) onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    setLoading(true);
    setStatusMessage('Searching literature & synthesis...');

    try {
      if (activeSessionId) {
        await apiClient.executeDeepResearch(
          activeSessionId, 
          q, 
          (_step, msg) => {
            setStatusMessage(msg);
          }
        );
      }
      
      const searchRes = await apiClient.searchResearch(q);
      setData(searchRes);
      setShowDropdown(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div ref={containerRef} className="relative z-20">
      <form onSubmit={onSubmit} className="relative flex items-center">
        <div 
          className="flex items-center gap-2 px-2.5 h-8 rounded border transition-colors w-full sm:w-80 md:w-96"
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
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search literature, topics or synthesize..."
            className="flex-1 min-w-0 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none"
          />

          {query && !loading && (
            <button
              type="button"
              onClick={() => { setQuery(''); setData(null); }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-selected)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Run'}
          </button>
        </div>
      </form>

      {/* Progress status line */}
      {loading && statusMessage && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface-base)] border border-[var(--border-subtle)] rounded shadow-sm">
          {statusMessage}
        </div>
      )}

      {/* Suggestions / Results Dropdown */}
      {showDropdown && !loading && (
        <div 
          className="absolute left-0 top-full mt-1 w-full sm:w-96 rounded-lg border p-1 z-30 shadow-md text-xs"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border-medium)',
            maxHeight: '360px',
            overflowY: 'auto'
          }}
        >
          {/* Recent/Suggested queries */}
          {!data && (
            <div className="space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Suggested Topics
              </div>
              {SUGGESTED_QUERIES.map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(sq);
                    handleSearch(sq);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{sq}</span>
                  <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {data && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <span>{data.totalResults} results for &ldquo;{data.normalizedQuery}&rdquo;</span>
                <button 
                  onClick={() => { setData(null); setShowDropdown(false); }}
                  className="hover:text-[var(--text-primary)]"
                >
                  Close
                </button>
              </div>

              {data.results.length === 0 ? (
                <div className="py-4 text-center text-[var(--text-muted)] text-xs">
                  No matching entities found.
                </div>
              ) : (
                data.results.map((res) => (
                  <div 
                    key={res.id}
                    onClick={() => {
                      onOpenSession(res.sessionId);
                      setShowDropdown(false);
                    }}
                    className="p-2 rounded hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-[var(--text-muted)] mb-0.5">
                      <span className="uppercase font-semibold">{res.type.replace('_', ' ')}</span>
                      {res.domain && <span>{res.domain}</span>}
                    </div>
                    <div className="font-medium text-[var(--text-primary)] leading-tight">{res.label}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
