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
}

const nodeWidth = 260;
const nodeHeight = 110;

const getLayoutedElements = (
  nodes: Node[], 
  edges: Edge[], 
  direction: 'LR' | 'TB' = 'LR'
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 45,
    ranksep: 75,
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

function ViewportFitter({ nodeCount, edgeCount }: { nodeCount: number; edgeCount: number }) {
  const { fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (!nodesInitialized || nodeCount === 0) return;
    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.15, duration: 300 });
    });
    return () => cancelAnimationFrame(frame);
  }, [nodeCount, edgeCount, nodesInitialized, fitView]);

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
  const rawDataRef = useRef<{ nodes: MindMapNode[]; edges: MindMapEdge[] }>({ nodes: [], edges: [] });

  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMindMap(sessionId);
      rawDataRef.current = { nodes: data.nodes, edges: data.edges };

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

      const flowEdges: Edge[] = data.edges.map((e) => ({
        id: e.id || `edge-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        label: e.relationship.replace(/_/g, ' ').toLowerCase(),
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: 'var(--border-strong)'
        }
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        flowNodes, 
        flowEdges, 
        layoutDirection
      );

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
    setTimeout(() => fitView({ padding: 0.15, duration: 250 }), 50);
  }, [layoutDirection, nodes, edges, setNodes, setEdges, fitView]);

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
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] text-xs font-mono">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
        <span>Loading research canvas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-2 text-xs">
        <span className="text-[var(--status-danger)] font-medium">{error}</span>
        <button
          onClick={loadGraph}
          className="px-2.5 py-1 rounded text-xs bg-[var(--surface-selected)] hover:text-[var(--text-primary)]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none">
      {nodes.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-xs text-[var(--text-muted)]">
          No research entities in this workspace. Run a search query to populate.
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onMove={handleViewportChange}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={2.5}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
        >
          <ViewportFitter nodeCount={nodes.length} edgeCount={edges.length} />
          
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
                  case 'SOURCE_PAPER': return 'var(--node-paper)';
                  case 'PAGE': return 'var(--node-page)';
                  case 'CONCEPT': return 'var(--node-concept)';
                  case 'SEARCH': return 'var(--node-search)';
                  case 'AI_INSIGHT': return 'var(--node-insight)';
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
            onFitView={() => fitView({ padding: 0.15, duration: 250 })}
            onResetView={() => fitView({ padding: 0.15, duration: 250 })}
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
