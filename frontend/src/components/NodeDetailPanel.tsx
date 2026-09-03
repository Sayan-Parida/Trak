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
      className="absolute top-3 right-3 z-20 w-80 max-w-[calc(100vw-24px)] max-h-[calc(100%-24px)] flex flex-col rounded-lg border shadow-panel select-none overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-base)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div 
        className="h-9 px-3 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono uppercase font-semibold text-[var(--text-muted)] tracking-wider">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Title */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
            {data.label}
          </h3>
          {data.authors && data.authors.length > 0 && (
            <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
              {data.authors.join(', ')}
            </p>
          )}
        </div>

        {/* Abstract / Excerpt */}
        {data.abstract && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] font-semibold">Summary</span>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {data.abstract}
            </p>
          </div>
        )}

        {/* Key Insights (if synthesis) */}
        {data.insights && data.insights.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] font-semibold">Key Findings</span>
            <ul className="space-y-1 text-[11px] text-[var(--text-secondary)] pl-3 list-disc">
              {data.insights.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Entities in Graph */}
        {connectedNodes.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] font-semibold">
              Connections ({connectedNodes.length})
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {connectedNodes.map((cNode) => (
                <button
                  key={cNode.id}
                  onClick={() => onSelectConnectedNode?.(cNode.id)}
                  className="w-full text-left p-1.5 rounded hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-1">
                    <span className="text-[9px] font-mono text-[var(--text-faint)] uppercase block">
                      {cNode.relationship}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate block">
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
