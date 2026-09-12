import { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight
} from 'lucide-react';
import { NodeType } from '../types';

interface NodeDetailPanelProps {
  data: {
    id: string;
    label: string;
    type: NodeType;
    domain?: string | null;
    url?: string;
    abstract?: string;
    authors?: string[];
    citationCount?: number;
    relevanceScore?: number;
    insights?: string[];
    tags?: string[];
    timestamp?: string;
    metadata?: Record<string, unknown>;
  };
  connectedNodes?: Array<{
    id: string;
    label: string;
    type: NodeType;
    relationship: string;
  }>;
  onSelectConnectedNode?: (nodeId: string) => void;
  onClose: () => void;
}

export default function NodeDetailPanel({
  data,
  connectedNodes = [],
  onSelectConnectedNode,
  onClose
}: NodeDetailPanelProps) {
  const [copiedCitation, setCopiedCitation] = useState(false);

  const recordAccent = data.type === 'SEARCH'
    ? 'var(--node-search)'
    : data.type === 'PAGE' || data.type === 'SOURCE_PAPER'
      ? 'var(--node-page)'
      : data.type === 'DOMAIN'
        ? 'var(--text-secondary)'
        : 'var(--accent)';

  if (!data) return null;

  const handleCopyBibtex = () => {
    const authorStr = data.authors ? data.authors.join(' and ') : 'ResearchMind';
    const bibtex = `@article{${data.id.replace(/[^a-zA-Z0-9]/g, '_')},
  title = {${data.label}},
  author = {${authorStr}},
  year = {2026},
  url = {${data.url || ''}}
}`;
    navigator.clipboard.writeText(bibtex);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 1500);
  };

  return (
    <aside 
      className="absolute top-5 right-5 z-20 w-[24rem] max-w-[calc(100vw-40px)] max-h-[calc(100%-40px)] flex flex-col rounded-[var(--radius-sm)] border shadow-panel select-none overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-base)',
        borderTop: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${recordAccent}`,
      }}
    >
      {/* Header */}
      <div 
        className="h-11 px-4 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-mono uppercase font-semibold text-[var(--accent)] tracking-[0.14em]">
            {data.type.replace('_', ' ')}
          </span>
          {data.domain && (
            <span className="text-[10px] font-mono text-[var(--text-faint)] truncate max-w-[120px]">
              • {data.domain}
            </span>
          )}
        </div>

        <button 
          onClick={onClose}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-[13px]">
        {/* Title */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-semibold text-[var(--text-primary)] leading-[1.05] tracking-[-0.02em]">
            {data.label}
          </h3>
          {data.authors && data.authors.length > 0 && (
            <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
              {data.authors.join(', ')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-y border-[var(--border-subtle)] py-3 text-[10px] font-mono">
          <div>
            <span className="block uppercase tracking-[0.12em] text-[var(--text-faint)]">Record type</span>
            <span className="mt-1 block text-[var(--text-secondary)]">{data.type.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="block uppercase tracking-[0.12em] text-[var(--text-faint)]">Last seen</span>
            <span className="mt-1 block text-[var(--text-secondary)]">{data.timestamp ? new Date(data.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not recorded'}</span>
          </div>
        </div>

        {data.timestamp && (
          <div className="border border-[var(--border-medium)] bg-[var(--surface-subtle)] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--node-concept)]">Last recorded activity</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              Last recorded activity for this {data.type === 'SEARCH' ? 'query' : 'record'}.
            </p>
          </div>
        )}

        {/* Abstract / Excerpt */}
        {data.abstract && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[var(--accent)] font-semibold tracking-[0.12em]">Research note</span>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {data.abstract}
            </p>
          </div>
        )}

        {/* Key Insights (if synthesis) */}
        {data.insights && data.insights.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[var(--accent)] font-semibold tracking-[0.12em]">Key Findings</span>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] pl-3 list-disc">
              {data.insights.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Entities in Graph */}
        {connectedNodes.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-[10px] font-mono uppercase text-[var(--accent)] font-semibold tracking-[0.12em]">
              Path to this record ({connectedNodes.length})
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {connectedNodes.map((cNode) => (
                <button
                  key={cNode.id}
                  onClick={() => onSelectConnectedNode?.(cNode.id)}
                  className="w-full text-left p-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-1">
                    <span className="text-[9px] font-mono text-[var(--text-faint)] uppercase block">
                      {cNode.relationship}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate block">
                      {cNode.label}
                    </span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-[var(--text-faint)] group-hover:text-[var(--text-primary)] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div 
        className="h-10 px-3 border-t flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}
      >
        <button
          onClick={handleCopyBibtex}
          className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {copiedCitation ? <Check className="w-3 h-3 text-[var(--status-active)]" /> : <Copy className="w-3 h-3" />}
          <span>{copiedCitation ? 'Copied' : 'BibTeX'}</span>
        </button>

        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline"
          >
            <span>Open Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </aside>
  );
}
