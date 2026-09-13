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
import { MapControls } from './MapControls';
import { MindMapNode, MindMapEdge, NodeType } from '../types';
import { Loader2 } from 'lucide-react';

interface Props {
  sessionId: string;
  focusNodeId?: string | null;
}

const nodeWidth = 240;
const nodeHeight = 100;
const positionsKey = (sessionId: string) => `researchmind:node-positions:${sessionId}`;

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
  selected
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

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-auto absolute rounded-[var(--radius-xs)] border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.08em]"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 8}px)`,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-base)',
              borderColor: selected || hovered ? 'var(--accent)' : 'var(--border-subtle)',
              opacity: selected || hovered ? 1 : 0.82,
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

function InnerMindMap({ sessionId }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<NodeType | 'ALL'>('ALL');
  const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB'>('LR');
  const [showMinimap, setShowMinimap] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const { fitView, zoomIn, zoomOut, setCenter, getZoom } = useReactFlow();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const savedPositionsRef = useRef<SavedPositions>({});
  const rawDataRef = useRef<{ nodes: MindMapNode[]; edges: MindMapEdge[] }>({ nodes: [], edges: [] });

  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMindMap(sessionId);
      rawDataRef.current = { nodes: data.nodes, edges: data.edges };
      const savedPositions = readSavedPositions(sessionId);
      savedPositionsRef.current = savedPositions;

      const flowNodes: Node[] = data.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: 0, y: 0 },
        data: {
          ...n,
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
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: 'var(--border-strong)'
        }
      }));

      const { nodes: autoLayoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        flowNodes, 
        flowEdges, 
        layoutDirection
      );
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

  const toggleLayout = useCallback(() => {
    const nextDir = layoutDirection === 'LR' ? 'TB' : 'LR';
    setLayoutDirection(nextDir);
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(nodes, edges, nextDir);
    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => fitView({ padding: 0.05, duration: 250 }), 50);
  }, [layoutDirection, nodes, edges, setNodes, setEdges, fitView]);

  const resetLayout = useCallback(() => {
    localStorage.removeItem(positionsKey(sessionId));
    savedPositionsRef.current = {};
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, layoutDirection);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    requestAnimationFrame(() => fitView({ padding: 0.05, duration: 250 }));
  }, [sessionId, nodes, edges, layoutDirection, setNodes, setEdges, fitView]);

  const handleNodeDragStop = useCallback((_: MouseEvent | TouchEvent, node: Node) => {
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
  }, [edges, setNodes]);

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
  }, [setNodes]);

  // Node filtering
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const matchesFilter = activeFilter === 'ALL' || n.type === activeFilter;
        return {
          ...n,
          data: {
            ...n.data,
            isDimmed: !matchesFilter
          }
        };
      })
    );
  }, [activeFilter, setNodes]);

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
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] text-xs font-mono select-none">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
        <span>Loading your research trail&hellip;</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3 select-none">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Couldn&apos;t load this research map.</span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono max-w-xs leading-relaxed">
            {error}
          </span>
        </div>
        <button
          onClick={loadGraph}
          className="px-3 py-1.5 rounded text-xs font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="w-full h-full min-w-0 min-h-0 relative select-none">
      {nodes.filter((n) => n.type !== 'SESSION').length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-xs text-[var(--text-muted)] select-none">
          <span className="font-medium text-[var(--text-secondary)] mb-1">This session doesn&apos;t have enough research activity to build a map yet.</span>
          <span className="text-[11px] font-mono leading-relaxed max-w-xs">Try running a deep research query or importing sources to populate the workspace.</span>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
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
                width: 140,
                height: 90,
                margin: 0
              }}
              nodeStrokeWidth={1}
              nodeColor={(n) => {
                switch (n.type) {
                  case 'SESSION': return 'var(--node-concept)';
                  case 'SOURCE_PAPER': return 'var(--node-paper)';
                  case 'PAGE': return 'var(--node-page)';
                  case 'CONCEPT': return 'var(--node-concept)';
                  case 'SEARCH': return 'var(--node-search)';
                  case 'AI_INSIGHT': return 'var(--node-insight)';
                  case 'DOMAIN': return 'var(--text-secondary)';
                  default: return 'var(--text-muted)';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.2)"
            />
          )}

          <MapControls
            zoom={zoomLevel}
            onZoomIn={() => zoomIn({ duration: 200 })}
            onZoomOut={() => zoomOut({ duration: 200 })}
            onFitView={() => fitView({ padding: 0.05, duration: 250 })}
            onResetLayout={resetLayout}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            layoutDirection={layoutDirection}
            onToggleLayout={toggleLayout}
            showMinimap={showMinimap}
            onToggleMinimap={() => setShowMinimap(!showMinimap)}
            onExport={handleExportGraph}
            nodeCount={nodes.length}
            edgeCount={edges.length}
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

export default function MindMap({ sessionId }: Props) {
  return (
    <ReactFlowProvider>
      <InnerMindMap sessionId={sessionId} />
    </ReactFlowProvider>
  );
}
