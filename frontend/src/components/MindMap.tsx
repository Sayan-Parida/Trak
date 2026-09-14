import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useNodesInitialized,
  useReactFlow,
  ReactFlowProvider,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  EdgeProps,
  Node,
  Edge,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { apiClient } from '../api/client';
import { researchStore } from '../api/researchStore';
import { nodeTypes } from './CustomNodes';
import NodeDetailPanel from './NodeDetailPanel';
import { MapControls, MapFilterState, DEFAULT_MAP_FILTER, PRIMARY_RELATIONSHIPS, SECONDARY_RELATIONSHIPS } from './MapControls';
import { MindMapNode, MindMapEdge, NodeType } from '../types';
import { Loader2 } from 'lucide-react';

interface Props {
  sessionId: string;
  focusNodeId?: string | null;
  onFocusNodeConsumed?: () => void;
}

const nodeWidth = 240;
const nodeHeight = 100;
const positionsKey = (sessionId: string) => `researchmind:node-positions:${sessionId}`;
const pathwayRelationships = new Set(['SEARCH_TO_SEARCH', 'RESULTS_IN', 'PAGE_TO_PAGE', 'NAVIGATED_FROM']);
const layoutRelationships = new Set(['SEARCH_TO_SEARCH', 'RESULTS_IN', 'PAGE_TO_PAGE', 'NAVIGATED_FROM']);

const edgePriority = (relationship: string) => {
  if (relationship === 'SEARCH_TO_SEARCH' || relationship === 'RESULTS_IN') return 'anchor';
  if (pathwayRelationships.has(relationship)) return 'movement';
  return 'context';
};

const edgeLabelOffset = (relationship: string) => {
  if (relationship === 'SEARCH_TO_SEARCH') return -18;
  if (relationship === 'RESULTS_IN') return 16;
  if (relationship === 'PAGE_TO_PAGE' || relationship === 'NAVIGATED_FROM') return 22;
  return -22;
};

type SavedPositions = Record<string, { x: number; y: number }>;

const readSavedPositions = (sessionId: string): SavedPositions => {
  try {
    const value = localStorage.getItem(positionsKey(sessionId));
    return value ? JSON.parse(value) as SavedPositions : {};
  } catch {
    return {};
  }
};

const writeSavedPositions = (sessionId: string, positions: SavedPositions) => {
  localStorage.setItem(positionsKey(sessionId), JSON.stringify(positions));
};

const getLayoutedElements = (
  nodes: Node[], 
  edges: Edge[], 
  direction: 'LR' | 'TB' = 'LR'
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 35,
    ranksep: 40,
    marginx: 30,
    marginy: 30
  });
  
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id) || { x: 0, y: 0 };
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

function ResearchEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
  selected,
  data
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
    offset: 24
  });
  const [hovered, setHovered] = useState(false);
  const priority = String(data?.priority || 'context');
  const showLabel = priority === 'anchor' || hovered || selected;
  const labelOffset = Number(data?.labelOffset || 0);
  const active = hovered || selected;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={28}
        style={{
          ...style,
          stroke: active ? 'var(--accent)' : priority === 'anchor' ? 'var(--node-search)' : 'var(--border-strong)',
          strokeWidth: active || priority === 'anchor' ? 1.8 : 1,
          opacity: active ? 1 : priority === 'anchor' ? 0.84 : priority === 'movement' ? 0.55 : 0.24
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {label && showLabel && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-auto absolute border-[1.5px] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.08em]"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + labelOffset}px)`,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-base)',
              borderColor: selected || hovered ? 'var(--accent)' : 'var(--border-medium)',
              opacity: selected || hovered ? 1 : priority === 'anchor' ? 0.86 : 0.72,
              boxShadow: 'var(--shadow-xs)',
              zIndex: selected || hovered ? 3 : 1
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { research: ResearchEdge };

function ViewportFitter({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (!nodesInitialized || nodeCount === 0) return;
    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.05, duration: 300 });
    });
    return () => cancelAnimationFrame(frame);
  }, [nodeCount, nodesInitialized, fitView]);

  return null;
}

function InnerMindMap({ sessionId, focusNodeId, onFocusNodeConsumed }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [filter, setFilter] = useState<MapFilterState>(DEFAULT_MAP_FILTER);
  const layoutDirection: 'LR' | 'TB' = 'LR';
  const [showMinimap, setShowMinimap] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const { fitView, zoomIn, zoomOut, setCenter, getZoom } = useReactFlow();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const savedPositionsRef = useRef<SavedPositions>({});
  const resettingLayoutRef = useRef(false);
  const rawDataRef = useRef<{ nodes: MindMapNode[]; edges: MindMapEdge[] }>({ nodes: [], edges: [] });
  const focusHandledRef = useRef<string | null>(null);

  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMindMap(sessionId);
      rawDataRef.current = { nodes: data.nodes, edges: data.edges };
      const savedPositions = readSavedPositions(sessionId);
      savedPositionsRef.current = savedPositions;
      const domainNodeIds = new Set(
        data.nodes.filter((node) => node.type === 'DOMAIN').map((node) => node.id)
      );

      const flowNodes: Node[] = data.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        hidden: n.type === 'DOMAIN',
        position: { x: 0, y: 0 },
        data: {
          ...n,
          compact: data.nodes.length > 15 && n.type === 'PAGE',
          isLatest: false,
          isDimmed: false,
          isFocused: false
        }
      }));

      const flowEdges: Edge[] = data.edges.map((e, index) => ({
        id: `${e.id || `edge-${e.source}-${e.target}`}-${index}`,
        source: e.source,
        target: e.target,
        label: e.relationship.replace(/_/g, ' ').toLowerCase(),
        type: 'research',
        data: {
          priority: edgePriority(e.relationship),
          relationship: e.relationship,
          labelOffset: edgeLabelOffset(e.relationship)
        },
        hidden: domainNodeIds.has(e.source) || domainNodeIds.has(e.target),
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: 'var(--border-strong)'
        }
      }));

      const latestNode = data.nodes
        .filter((node) => node.type !== 'SESSION' && node.type !== 'DOMAIN' && node.timestamp)
        .sort((left, right) => new Date(right.timestamp!).getTime() - new Date(left.timestamp!).getTime())[0];
      if (latestNode) {
        flowNodes.forEach((node) => {
          node.data = { ...node.data, isLatest: node.id === latestNode.id };
        });
      }

      const { nodes: autoLayoutedNodes } = getLayoutedElements(
        flowNodes, 
        flowEdges.filter((edge) => layoutRelationships.has(String(edge.data?.relationship))), 
        layoutDirection
      );
      const layoutedEdges = flowEdges;
      const layoutedNodes = autoLayoutedNodes.map((node) => ({
        ...node,
        position: savedPositions[node.id] || node.position
      }));

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load research graph');
    } finally {
      setLoading(false);
    }
  }, [sessionId, layoutDirection, setNodes, setEdges]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        fitView({ padding: 0.05, duration: 0 });
      });
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [fitView]);

  useEffect(() => {
    loadGraph();
    const unsubscribe = researchStore.subscribe(() => {
      loadGraph();
    });
    return () => {
      unsubscribe();
    };
  }, [loadGraph]);

  const handleViewportChange = useCallback(() => {
    const currentZoom = getZoom();
    if (currentZoom) setZoomLevel(currentZoom);
  }, [getZoom]);

  const resetLayout = useCallback(() => {
    resettingLayoutRef.current = true;
    localStorage.removeItem(positionsKey(sessionId));
    savedPositionsRef.current = {};
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, layoutDirection);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    requestAnimationFrame(() => {
      localStorage.removeItem(positionsKey(sessionId));
      resettingLayoutRef.current = false;
      fitView({ padding: 0.05, duration: 250 });
    });
  }, [sessionId, nodes, edges, layoutDirection, setNodes, setEdges, fitView]);

  const handleNodeDragStop = useCallback((_: MouseEvent | TouchEvent, node: Node) => {
    if (resettingLayoutRef.current) return;
    const nextPositions = {
      ...savedPositionsRef.current,
      [node.id]: { x: node.position.x, y: node.position.y }
    };
    savedPositionsRef.current = nextPositions;
    writeSavedPositions(sessionId, nextPositions);
  }, [sessionId]);

  // Focus Mode
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeData(node.data);

    const connectedIds = new Set<string>();
    connectedIds.add(node.id);
    edges.forEach((edge) => {
      if (edge.source === node.id) connectedIds.add(edge.target);
      if (edge.target === node.id) connectedIds.add(edge.source);
    });

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isDimmed: !connectedIds.has(n.id),
          isFocused: n.id === node.id
        }
      }))
    );

    setEdges((current) => current.map((edge) => ({
      ...edge,
      selected: edge.source === node.id || edge.target === node.id
    })));
  }, [edges, setEdges, setNodes]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeData(null);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isDimmed: false,
          isFocused: false
        }
      }))
    );
    setEdges((current) => current.map((edge) => ({ ...edge, selected: false })));
  }, [setEdges, setNodes]);

  // Keyboard: F = fit graph to screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('input, textarea, [contenteditable="true"]')) return;
      if (e.key.toLowerCase() === 'f') {
        fitView({ padding: 0.05, duration: 250 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitView]);

  // Node & connection visibility filtering
  useEffect(() => {
    const hiddenNodeIds = new Set<string>();
    const isTypeVisible = (type: string, f: MapFilterState): boolean => {
      switch (type) {
        case 'SESSION': return f.sessions;
        case 'SEARCH': return f.searches;
        case 'PAGE':
        case 'SOURCE_PAPER': return f.sources;
        case 'DOMAIN': return f.domains;
        default: return true;
      }
    };

    setNodes((nds) =>
      nds.map((n) => {
        const visible = isTypeVisible(String(n.type), filter);
        if (!visible) hiddenNodeIds.add(n.id);
        return { ...n, hidden: !visible };
      })
    );
    setEdges((current) =>
      current.map((edge) => {
        const relationship = String(edge.data?.relationship || edge.label || '');
        const relationshipVisible = PRIMARY_RELATIONSHIPS.has(relationship)
          ? filter.researchConnections
          : SECONDARY_RELATIONSHIPS.has(relationship)
            ? filter.secondaryConnections
            : true;
        const touchesHiddenNode = hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target);
        const isDomainEdge = edge.source.startsWith('domain:') || edge.target.startsWith('domain:');
        return {
          ...edge,
          hidden: !relationshipVisible || touchesHiddenNode || (isDomainEdge && !filter.domains)
        };
      })
    );
  }, [filter, setEdges, setNodes]);

  // Connected nodes calculation
  const connectedNodesForSelected = useMemo(() => {
    if (!selectedNodeData) return [];
    const relations: Array<{ id: string; label: string; type: NodeType; relationship: string }> = [];

    edges.forEach((edge) => {
      if (edge.source === selectedNodeData.id) {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode) {
          const tData = targetNode.data as Record<string, any>;
          relations.push({
            id: targetNode.id,
            label: String(tData.label || targetNode.id),
            type: targetNode.type as NodeType,
            relationship: String(edge.label || 'relates to')
          });
        }
      } else if (edge.target === selectedNodeData.id) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          const sData = sourceNode.data as Record<string, any>;
          relations.push({
            id: sourceNode.id,
            label: String(sData.label || sourceNode.id),
            type: sourceNode.type as NodeType,
            relationship: `inbound: ${String(edge.label || 'relates to')}`
          });
        }
      }
    });

    return relations;
  }, [selectedNodeData, edges, nodes]);

  const handleJumpToNode = useCallback((nodeId: string) => {
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (targetNode) {
      setSelectedNodeData(targetNode.data);
      setCenter(targetNode.position.x + nodeWidth / 2, targetNode.position.y + nodeHeight / 2, {
        zoom: 1.1,
        duration: 400
      });
    }
  }, [nodes, setCenter]);

  // Resume Research: focus a node (e.g. the session's stopping point) once the
  // graph is loaded, highlighting it and its connected research path.
  useEffect(() => {
    if (!focusNodeId) return;
    if (focusHandledRef.current === focusNodeId) return;
    if (nodes.length === 0) return;
    const target = nodes.find((n) => n.id === focusNodeId);
    if (target) {
      focusHandledRef.current = focusNodeId;
      onNodeClick(null, target);
      handleJumpToNode(focusNodeId);
    }
    onFocusNodeConsumed?.();
  }, [focusNodeId, nodes, onNodeClick, handleJumpToNode, onFocusNodeConsumed]);

  const handleExportGraph = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rawDataRef.current, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `researchmind-graph-${sessionId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [sessionId]);

  if (loading && nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center select-none bg-[var(--graph-bg)]">
        <div className="b-panel px-6 py-5 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
          <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            Reconstructing your research trail&hellip;
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-4 select-none bg-[var(--graph-bg)]">
        <div className="b-panel px-6 py-5 flex flex-col items-center gap-2 max-w-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--status-danger)]">
            Graph load failure
          </span>
          <span className="font-display text-sm font-bold text-[var(--text-primary)]">
            Couldn&apos;t load this research map.
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono leading-relaxed">
            {error}
          </span>
        </div>
        <button
          onClick={loadGraph}
          className="b-btn b-btn--accent text-xs px-4 py-1.5"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="w-full h-full min-w-0 min-h-0 relative select-none">
      {nodes.filter((n) => n.type !== 'SESSION').length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[var(--graph-bg)] select-none">
          <div className="b-panel px-6 py-5 max-w-sm flex flex-col gap-1.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-faint)]">Empty canvas</span>
            <span className="font-display text-sm font-bold text-[var(--text-primary)]">This session doesn&apos;t have enough research activity to build a map yet.</span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] leading-relaxed">Try running a deep research query or importing sources to populate the workspace.</span>
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          onEdgeClick={(_, edge) => setEdges((current) => current.map((item) => ({
            ...item,
            selected: item.id === edge.id
          })))}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onMove={handleViewportChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.5}
          maxZoom={2.5}
          fitView
          fitViewOptions={{ padding: 0.05 }}
          proOptions={{ hideAttribution: true }}
        >
          <ViewportFitter nodeCount={nodes.length} />
          
          <Background 
            gap={20} 
            size={1} 
            color="var(--graph-dot)" 
          />

          {showMinimap && (
            <MiniMap
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                width: 150,
                height: 96,
                margin: 0,
                border: '2px solid var(--border-strong)',
                borderRadius: 2,
                boxShadow: 'var(--shadow-md)'
              }}
              nodeStrokeWidth={1.5}
              nodeColor={(n) => {
                switch (n.type) {
                  case 'SESSION': return 'var(--node-session)';
                  case 'SOURCE_PAPER': return 'var(--node-paper)';
                  case 'PAGE': return 'var(--node-page)';
                  case 'CONCEPT': return 'var(--node-concept)';
                  case 'SEARCH': return 'var(--node-search)';
                  case 'AI_INSIGHT': return 'var(--node-insight)';
                  case 'DOMAIN': return 'var(--node-domain)';
                  default: return 'var(--text-muted)';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.35)"
            />
          )}

          <MapControls
            zoom={zoomLevel}
            onZoomIn={() => zoomIn({ duration: 200 })}
            onZoomOut={() => zoomOut({ duration: 200 })}
            onFitView={() => fitView({ padding: 0.05, duration: 250 })}
            onResetLayout={resetLayout}
            filter={filter}
            onFilterChange={setFilter}
            onResetFilter={() => setFilter(DEFAULT_MAP_FILTER)}
            showMinimap={showMinimap}
            onToggleMinimap={() => setShowMinimap(!showMinimap)}
            onExport={handleExportGraph}
          />
        </ReactFlow>
      )}

      {/* Floating Node Detail Inspector Drawer */}
      {selectedNodeData && (
        <NodeDetailPanel
          data={selectedNodeData}
          connectedNodes={connectedNodesForSelected}
          onSelectConnectedNode={handleJumpToNode}
          onClose={() => {
            setSelectedNodeData(null);
            onPaneClick();
          }}
        />
      )}
    </div>
  );
}

export default function MindMap({ sessionId, focusNodeId, onFocusNodeConsumed }: Props) {
  return (
    <ReactFlowProvider>
      <InnerMindMap sessionId={sessionId} focusNodeId={focusNodeId} onFocusNodeConsumed={onFocusNodeConsumed} />
    </ReactFlowProvider>
  );
}
