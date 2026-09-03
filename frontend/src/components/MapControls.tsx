import { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  MapPin, 
  Filter, 
  Layers, 
  Download,
  Check
} from 'lucide-react';
import { NodeType } from '../types';

interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetView: () => void;
  activeFilter: NodeType | 'ALL';
  onFilterChange: (filter: NodeType | 'ALL') => void;
  layoutDirection: 'LR' | 'TB';
  onToggleLayout: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onExport: () => void;
  nodeCount: number;
  edgeCount: number;
}

export const MapControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetView,
  activeFilter,
  onFilterChange,
  layoutDirection,
  onToggleLayout,
  showMinimap,
  onToggleMinimap,
  onExport,
  nodeCount,
  edgeCount
}: MapControlsProps) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = () => {
    onExport();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Top Right: Minimal Filter & Layout pill */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
              activeFilter !== 'ALL'
                ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] border-[var(--border-medium)] font-semibold'
                : 'bg-[var(--surface-base)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>{activeFilter === 'ALL' ? 'Filter' : activeFilter.replace('_', ' ')}</span>
          </button>

          {showFilterMenu && (
            <div 
              className="absolute right-0 mt-1 w-36 rounded-lg p-1 z-20 border text-xs shadow-md"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderColor: 'var(--border-medium)',
              }}
            >
              {[
                { key: 'ALL', label: 'All' },
                { key: 'SOURCE_PAPER', label: 'Papers' },
                { key: 'CONCEPT', label: 'Concepts' },
                { key: 'AI_INSIGHT', label: 'Syntheses' },
                { key: 'SEARCH', label: 'Queries' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    onFilterChange(item.key as any);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-left ${
                    activeFilter === item.key ? 'bg-[var(--surface-selected)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <span>{item.label}</span>
                  {activeFilter === item.key && <Check className="w-3 h-3 text-[var(--accent)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onToggleLayout}
          title={`Layout: ${layoutDirection === 'LR' ? 'Horizontal' : 'Vertical'}`}
          className="p-1 rounded bg-[var(--surface-base)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleExport}
          title="Export Graph JSON"
          className="p-1 rounded bg-[var(--surface-base)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[var(--status-active)]" /> : <Download className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom Left: Minimal Floating Canvas Viewport Bar */}
      <div 
        className="absolute bottom-3 left-3 z-10 flex items-center gap-0.5 p-0.5 rounded border select-none"
        style={{
          backgroundColor: 'var(--surface-base)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="px-1 text-[11px] font-mono text-[var(--text-muted)] min-w-[34px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3 bg-[var(--border-subtle)] mx-0.5" />

        <button
          onClick={onFitView}
          title="Fit to Screen [F]"
          className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetView}
          title="Recenter Canvas"
          className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3 bg-[var(--border-subtle)] mx-0.5" />

        <button
          onClick={onToggleMinimap}
          title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
          className={`p-1 rounded transition-colors ${
            showMinimap ? 'bg-[var(--surface-selected)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Left: Quiet Canvas Status */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <span className="text-[10px] font-mono text-[var(--text-faint)]">
          {nodeCount} nodes • {edgeCount} edges
        </span>
      </div>
    </>
  );
};
