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
  icon: Icon
}: {
  children: React.ReactNode;
  selected?: boolean;
  isDimmed?: boolean;
  isFocused?: boolean;
  accentColor: string;
  accentBg: string;
  typeLabel: string;
  icon: any;
}) => {
  return (
    <div
      className="relative rounded p-2.5 transition-all duration-150 cursor-pointer select-none"
      style={{
        width: 250,
        backgroundColor: 'var(--surface-base)',
        border: `1px solid ${selected || isFocused ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
        boxShadow: selected || isFocused ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        opacity: isDimmed ? 0.2 : 1,
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
      <div className="flex items-center justify-between gap-1.5 mb-1 text-[10px] font-mono">
        <span 
          className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-medium"
          style={{ backgroundColor: accentBg, color: accentColor }}
        >
          <Icon className="w-2.5 h-2.5" />
          <span>{typeLabel}</span>
        </span>
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
    >
      <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 mb-1">
        {data.label}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
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
    >
      <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 mb-1">
        {data.label}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
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
    >
      <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug mb-1">
        {data.label}
      </div>

      {data.abstract && (
        <div className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
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
    >
      <div className="text-xs italic text-[var(--text-primary)] leading-snug mb-1 font-serif">
        &ldquo;{data.label}&rdquo;
      </div>

      <div className="text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
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
    >
      <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug mb-1">
        {data.label}
      </div>

      {data.abstract && (
        <div className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
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
      className="px-2 py-1 rounded transition-colors select-none flex items-center gap-1.5"
      style={{
        backgroundColor: 'var(--surface-base)',
        border: `1px solid ${selected ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
        opacity: data.isDimmed ? 0.2 : 1,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'var(--border-strong)' }} />
      <Handle type="source" position={Position.Right} style={{ background: 'var(--border-strong)' }} />
      <Layers className="w-3 h-3 text-[var(--text-muted)]" />
      <span className="text-[11px] font-mono text-[var(--text-secondary)] font-medium">{data.label}</span>
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
      accentColor="var(--node-concept)"
      accentBg="var(--node-concept-bg)"
      typeLabel="Session"
      icon={Compass}
    >
      <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 mb-1">
        {data.label}
      </div>
      <div className="text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
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
