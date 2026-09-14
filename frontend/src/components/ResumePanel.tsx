import { useEffect, useMemo, useState } from 'react';
import { History, MapPinned } from 'lucide-react';
import { apiClient } from '../api/client';
import { PageVisit, ResumePoint } from '../types';
import { buildRestorePlan } from '../utils/restoreWorkspace';
import { isExtensionAvailable, restoreTabsViaExtension } from '../api/extensionBridge';

interface Props {
  sessionId: string;
  onViewPath: (nodeId: string) => void;
}

type RestoreStatus =
  | { kind: 'idle' }
  | { kind: 'restoring' }
  | { kind: 'restored'; count: number }
  | { kind: 'extension-required' }
  | { kind: 'failed' };

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

export default function ResumePanel({ sessionId, onViewPath }: Props) {
  const [resume, setResume] = useState<ResumePoint | null>(null);
  const [pages, setPages] = useState<PageVisit[]>([]);
  const [status, setStatus] = useState<RestoreStatus>({ kind: 'idle' });

  useEffect(() => {
    let cancelled = false;
    setResume(null);
    setPages([]);
    setStatus({ kind: 'idle' });
    Promise.all([
      apiClient.getResumePoint(sessionId),
      apiClient.getPages(sessionId)
    ])
      .then(([point, sessionPages]) => {
        if (cancelled) return;
        setResume(point);
        setPages(sessionPages);
      })
      .catch(() => {
        if (cancelled) return;
        setResume({ sessionId, page: null, search: null });
        setPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (status.kind !== 'restored') return;
    const timer = setTimeout(() => setStatus({ kind: 'idle' }), 5000);
    return () => clearTimeout(timer);
  }, [status]);

  const focusUrl = resume?.page?.url ?? null;
  const plan = useMemo(() => buildRestorePlan(pages, focusUrl), [pages, focusUrl]);
  const pagesReady = plan.urls.length;

  const handleRestore = async () => {
    if (pagesReady === 0) {
      setStatus({ kind: 'failed' });
      return;
    }
    setStatus({ kind: 'restoring' });
    const available = await isExtensionAvailable();
    if (!available) {
      setStatus({ kind: 'extension-required' });
      return;
    }
    const result = await restoreTabsViaExtension(plan.urls, plan.focusUrl);
    if (result.ok) {
      setStatus({ kind: 'restored', count: result.count ?? pagesReady });
    } else if (result.error === 'TRAK_EXTENSION_UNAVAILABLE') {
      setStatus({ kind: 'extension-required' });
    } else {
      setStatus({ kind: 'failed' });
    }
  };

  if (!resume) {
    return (
      <div className="b-panel w-64 px-3.5 py-3 text-left">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
          Resume research
        </div>
        <div className="mt-1.5 font-mono text-[10px] text-[var(--text-muted)]">
          Reading your trail&hellip;
        </div>
      </div>
    );
  }

  if (!resume.page) {
    return (
      <div className="b-panel w-64 px-3.5 py-3 text-left">
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
          Resume research
        </div>
        <div className="mt-1.5 font-display text-sm font-bold leading-tight text-[var(--text-primary)]">
          No stopping point yet
        </div>
        <div className="mt-1 font-mono text-[10px] leading-snug text-[var(--text-muted)]">
          Run a search or open a page to start a trail.
        </div>
      </div>
    );
  }

  const { page, search } = resume;
  const domain = page.domain || hostOf(page.url);
  const restoring = status.kind === 'restoring';

  return (
    <div className="b-panel w-64 px-3.5 py-3 text-left">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
        Resume research
      </div>
      <div className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
        You stopped here
      </div>

      <div
        className="mt-1.5 truncate font-display text-[13px] font-bold leading-tight text-[var(--text-primary)]"
        title={page.title}
      >
        {page.title}
      </div>

      <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
        {domain ? `${domain} · ` : ''}Last activity · {formatDate(page.lastVisited)}
      </div>

      {search && (
        <div className="mt-2 truncate rounded-[var(--radius-xs)] border-[1.5px] border-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--accent)]">
          Query: &ldquo;{search.queryText}&rdquo;
        </div>
      )}

      <div className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
        {pagesReady > 0 ? (
          <>
            <span className="font-bold text-[var(--text-primary)]">{pagesReady}</span>
            {pagesReady === 1 ? ' research page' : ' research pages'} ready to restore
          </>
        ) : (
          'No research pages to restore.'
        )}
      </div>

      <div className="mt-2 flex gap-1.5">
        <button
          onClick={handleRestore}
          disabled={restoring || pagesReady === 0}
          className="b-btn b-btn--accent w-full min-w-0 text-[10px] px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          title="Open your research pages as tabs, and jump back to your stopping point"
        >
          <History className="w-3 h-3 shrink-0" />
          <span className="truncate uppercase tracking-[0.08em]">
            {restoring ? 'Restoring…' : 'Restore research'}
          </span>
        </button>
        <button
          onClick={() => onViewPath(page.id)}
          className="b-btn w-full min-w-0 text-[10px] px-2 py-1"
          title="Show this page on the Research Map"
        >
          <MapPinned className="w-3 h-3 shrink-0" />
          <span className="truncate uppercase tracking-[0.08em]">View path</span>
        </button>
      </div>

      {status.kind === 'restoring' && (
        <div className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
          Restoring research tabs&hellip;
        </div>
      )}
      {status.kind === 'restored' && (
        <div className="mt-2 font-mono text-[10px] font-bold text-[var(--status-active)]">
          {status.count === 1 ? '1 research tab restored.' : `${status.count} research tabs restored.`}
        </div>
      )}
      {status.kind === 'extension-required' && (
        <div className="mt-2 font-mono text-[10px] leading-snug text-[var(--accent-warm)]">
          Pariet extension is required to restore tabs.
        </div>
      )}
      {status.kind === 'failed' && (
        <div className="mt-2 font-mono text-[10px] leading-snug text-[var(--accent-warm)]">
          Could not restore research tabs. Try again.
        </div>
      )}
    </div>
  );
}