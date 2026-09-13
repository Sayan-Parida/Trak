import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  BookOpen,
  Globe,
  Sparkles,
  Search,
  Cpu,
  Layers,
  Compass
} from 'lucide-react';
import { NodeType } from '../types';

interface CustomNodeProps {
  id: string;
  data: {
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
    isDimmed?: boolean;
    isFocused?: boolean;
    showTypeBadge?: boolean;
    typeBadgeBg?: string;
    typeBadgeFg?: string;
    typeBadgeLabel?: string;
    compact?: boolean;
    isLatest?: boolean;
  };
  selected?: boolean;
}

const NodeWrapper = memo(({
  children,
  selected,
  isDimmed,
  isFocused,
  accentColor,
  accentBg,
  typeLabel,
  icon: Icon,
  showTypeBadge,
  typeBadgeBg,
  typeBadgeFg,
  typeBadgeLabel,
  compact,
  isLatest
}: {
  children: React.ReactNode;
  selected?: boolean;
  isDimmed?: boolean;
  isFocused?: boolean;
  accentColor: string;
  accentBg: string;
  typeLabel: string;
  icon: any;
  showTypeBadge?: boolean;
  typeBadgeBg?: string;
  typeBadgeFg?: string;
  typeBadgeLabel?: string;
  compact?: boolean;
  isLatest?: boolean;
}) => {
  return (
    <div
      className={`pariet-node relative ${compact ? 'p-2.5' : 'p-3'} transition-all duration-150 cursor-pointer select-none border-l-4`}
      style={{
        width: compact ? 205 : 250,
        backgroundColor: `var(${isFocused ? '--surface-elevated' : '--surface-base'})`,
        borderTop: `2px solid ${selected || isFocused ? 'var(--accent)' : 'var(--border-strong)'}`,
        borderRight: `2px solid ${selected || isFocused ? 'var(--accent)' : 'var(--border-strong)'}`,
        borderBottom: `2px solid ${selected || isFocused ? 'var(--accent)' : 'var(--border-strong)'}`,
        borderLeftColor: accentColor,
        borderLeftWidth: 4,
        borderRadius: 'var(--radius-sm)',
        boxShadow: selected || isFocused ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        opacity: isDimmed ? 0.18 : 1,
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{
          width: 5,
          height: 5,
          background: 'var(--border-strong)',
          border: 'none',
          left: -3
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{
          width: 5,
          height: 5,
          background: 'var(--border-strong)',
          border: 'none',
          right: -3
        }} 
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{
          width: 5,
          height: 5,
          background: 'var(--border-strong)',
          border: 'none',
          top: -3
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{
          width: 5,
          height: 5,
          background: 'var(--border-strong)',
          border: 'none',
          bottom: -3
        }} 
      />

      {/* Type badge line */}
      <div className="flex items-center justify-between gap-1.5 mb-2 text-[9px] font-mono uppercase tracking-[0.08em]">
        <span 
          className="inline-flex items-center gap-1 px-1 py-0.5 border-[1.5px] font-bold"
          style={{
            backgroundColor: accentBg,
            color: accentColor,
            borderColor: 'var(--border-strong)',
            borderRadius: 'var(--radius-xs)'
          }}
        >
          <Icon className="w-2.5 h-2.5" />
          <span>{typeLabel}</span>
        </span>
        {showTypeBadge && (
          <span className="ml-1 text-[0.65em] font-bold border-[1.5px] px-1.5 py-0.5 text-xs tracking-[0.08em]"
            style={{ backgroundColor: typeBadgeBg, color: typeBadgeFg, borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-xs)' }}
          >
            {typeBadgeLabel}
          </span>
        )}
        {isLatest && (
          <span className="ml-auto inline-flex items-center gap-1 text-[8px] font-bold tracking-[0.08em] py-0.5 px-1"
            style={{ color: 'var(--surface-base)', backgroundColor: 'var(--border-strong)', borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-xs)' }}
          >
            ◼ STOPPING POINT
          </span>
        )}
      </div>

      {children}
    </div>
  );
});
NodeWrapper.displayName = 'NodeWrapper';

/* 1. Academic Paper Node */
export const PaperNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <NodeWrapper
      selected={selected}
      isDimmed={data.isDimmed}
      isFocused={data.isFocused}
      accentColor="var(--node-paper)"
      accentBg="var(--node-paper-bg)"
      typeLabel="Paper"
      icon={BookOpen}
      compact={data.compact}
      isLatest={data.isLatest}
    >
      <div style={{ fontFamily: 'var(--font-display)' }} className="text-[14px] font-semibold text-[var(--text-primary)] leading-[1.12] line-clamp-2 mb-2">
        {data.label}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-2 border-t-2 border-[var(--border-strong)]">
        <span className="truncate max-w-[140px]">{data.domain || 'academic'}</span>
        {data.citationCount !== undefined && <span>{data.citationCount} cited</span>}
      </div>
    </NodeWrapper>
  );
});
PaperNode.displayName = 'PaperNode';

/* 2. Web Page Node */
export const PageNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <NodeWrapper
      selected={selected}
      isDimmed={data.isDimmed}
      isFocused={data.isFocused}
      accentColor="var(--node-page)"
      accentBg="var(--node-page-bg)"
      typeLabel="Source"
      icon={Globe}
      showTypeBadge
      typeBadgeBg="var(--node-page)"
      typeBadgeFg="var(--text-primary)"
      typeBadgeLabel="PAGE"
      compact={data.compact}
      isLatest={data.isLatest}
    >
      <div style={{ fontFamily: 'var(--font-display)' }} className="text-[14px] font-semibold text-[var(--text-primary)] leading-[1.12] line-clamp-2 mb-2">
        {data.label}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-2 border-t-2 border-[var(--border-strong)]">
        <span className="truncate max-w-[180px]">{data.domain || data.url?.replace(/^https?:\/\//, '')}</span>
      </div>
    </NodeWrapper>
  );
});
PageNode.displayName = 'PageNode';

/* 3. Core Concept Node */
export const ConceptNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <NodeWrapper
      selected={selected}
      isDimmed={data.isDimmed}
      isFocused={data.isFocused}
      accentColor="var(--node-concept)"
      accentBg="var(--node-concept-bg)"
      typeLabel="Concept"
      icon={Sparkles}
      compact={data.compact}
      isLatest={data.isLatest}
    >
      <div style={{ fontFamily: 'var(--font-display)' }} className="text-[14px] font-semibold text-[var(--text-primary)] leading-[1.12] mb-2">
        {data.label}
      </div>

      {data.abstract && (
        <div className="text-[12px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {data.abstract}
        </div>
      )}
    </NodeWrapper>
  );
});
ConceptNode.displayName = 'ConceptNode';

/* 4. Search Query Node */
export const SearchNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <NodeWrapper
      selected={selected}
      isDimmed={data.isDimmed}
      isFocused={data.isFocused}
      accentColor="var(--node-search)"
      accentBg="var(--node-search-bg)"
      typeLabel="Query"
      icon={Search}
      showTypeBadge
      typeBadgeBg="var(--node-search)"
      typeBadgeFg="var(--text-primary)"
      typeBadgeLabel="SEARCH"
      compact={data.compact}
      isLatest={data.isLatest}
    >
      <div style={{ fontFamily: 'var(--font-display)' }} className="text-[14px] italic text-[var(--text-primary)] leading-[1.12] mb-2">
        &ldquo;{data.label}&rdquo;
      </div>

      <div className="text-[10px] font-mono text-[var(--text-muted)] pt-2 border-t-2 border-[var(--border-strong)]">
        Search expansion
      </div>
    </NodeWrapper>
  );
});
SearchNode.displayName = 'SearchNode';

/* 5. AI Insight Node */
export const InsightNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <NodeWrapper
      selected={selected}
      isDimmed={data.isDimmed}
      isFocused={data.isFocused}
      accentColor="var(--node-insight)"
      accentBg="var(--node-insight-bg)"
      typeLabel="Synthesis"
      icon={Cpu}
      compact={data.compact}
      isLatest={data.isLatest}
    >
      <div style={{ fontFamily: 'var(--font-display)' }} className="text-[14px] font-semibold text-[var(--text-primary)] leading-[1.12] mb-2">
        {data.label}
      </div>

      {data.abstract && (
        <div className="text-[12px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {data.abstract}
        </div>
      )}
    </NodeWrapper>
  );
});
InsightNode.displayName = 'InsightNode';

/* 6. Domain Node */
export const DomainNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <div
      className="px-2 py-1 transition-colors select-none flex items-center gap-1.5 border-l-4"
      style={{
        backgroundColor: 'var(--surface-base)',
        borderTop: `2px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
        borderRight: `2px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
        borderBottom: `2px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
        borderLeftColor: 'var(--node-domain)',
        borderLeftWidth: 4,
        borderRadius: 'var(--radius-xs)',
        boxShadow: 'var(--shadow-xs)',
        opacity: data.isDimmed ? 0.18 : 1,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'var(--border-strong)', borderRadius: 0 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'var(--border-strong)', borderRadius: 0 }} />
      <Layers className="w-3 h-3 text-[var(--text-muted)]" />
      <span className="text-[11px] font-mono text-[var(--text-secondary)] font-bold">{data.label}</span>
    </div>
  );
});
DomainNode.displayName = 'DomainNode';

export const nodeTypes = {
  SESSION: memo(({ data, selected }: CustomNodeProps) => (
    <NodeWrapper
      selected={selected}
      isDimmed={data.isDimmed}
      isFocused={data.isFocused}
      accentColor="var(--node-session)"
      accentBg="var(--node-session-bg)"
      typeLabel="Session"
      icon={Compass}
      compact={data.compact}
      isLatest={data.isLatest}
    >
      <div style={{ fontFamily: 'var(--font-display)' }} className="text-[14px] font-semibold text-[var(--text-primary)] leading-[1.12] line-clamp-2 mb-2">
        {data.label}
      </div>
      <div className="text-[10px] font-mono text-[var(--text-muted)] pt-2 border-t-2 border-[var(--border-strong)]">
        Root workspace
      </div>
    </NodeWrapper>
  )),
  SOURCE_PAPER: PaperNode,
  PAGE: PageNode,
  CONCEPT: ConceptNode,
  SEARCH: SearchNode,
  AI_INSIGHT: InsightNode,
  DOMAIN: DomainNode,
  custom: PaperNode
};
