import { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check
} from 'lucide-react';
import { PageVisit } from '../types';

interface Props {
  page: PageVisit;
  onClose: () => void;
}

export default function SourceReaderModal({ page, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyBibtex = () => {
    const bibtex = `@article{${page.id},
  title = {${page.title}},
  author = {${page.authors?.join(' and ') || 'Unknown'}},
  year = {${page.publishedDate ? page.publishedDate.slice(0, 4) : '2026'}},
  publisher = {${page.domain}},
  url = {${page.url}}
}`;
    navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-xl rounded-lg border shadow-panel overflow-hidden flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: 'var(--surface-base)',
          borderColor: 'var(--border-medium)',
        }}
      >
        {/* Header */}
        <div 
          className="h-10 px-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase font-semibold text-[var(--text-muted)] tracking-wider">
              {page.sourceType || 'Source Document'}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-faint)]">
              • {page.domain}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
              {page.title}
            </h2>
            {page.authors && page.authors.length > 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {page.authors.join(', ')}
              </p>
            )}
          </div>

          {/* Meta line */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
            {page.publishedDate && <span>Published: {page.publishedDate}</span>}
            {page.citationCount !== undefined && <span>{page.citationCount} citations</span>}
            <span>{page.visitCount} visits</span>
          </div>

          {/* Abstract */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] font-semibold">Abstract / Extract</span>
            <div className="p-3 rounded border bg-[var(--surface-subtle)] text-[11px] leading-relaxed text-[var(--text-secondary)]" style={{ borderColor: 'var(--border-subtle)' }}>
              {page.excerpt || 'Source content recorded in research repository.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="h-10 px-4 border-t flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}
        >
          <button
            onClick={handleCopyBibtex}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--status-active)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy BibTeX'}</span>
          </button>

          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            <span>Open Original Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
