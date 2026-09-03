import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { apiClient } from '../api/client';
import NodeDetailPanel from './NodeDetailPanel';

interface Props {
  sessionId: string;
}

const nodeWidth = 250;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });
  
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };

    newNode.targetPosition = isHorizontal ? Position.Left : Position.Top;
    newNode.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // Shift to center
    newNode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

const CustomNode = ({ data }: any) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[200px] max-w-[300px] ${
      data.type === 'SEARCH' ? 'bg-amber-50 border-amber-400' : 'bg-blue-50 border-blue-400'
    }`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center">
        <div className="text-xl mr-2">{data.type === 'SEARCH' ? '🔍' : '📄'}</div>
        <div className="flex-1 overflow-hidden">
          <div className="text-sm font-bold truncate" title={data.label}>{data.label}</div>
          {data.domain && <div className="text-xs text-gray-500 truncate">{data.domain}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function MindMap({ sessionId }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const data = await apiClient.getResearchGraph(sessionId);
        
        const initialNodes: Node[] = data.nodes.map(n => ({
          id: n.id,
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { ...n, domain: n.metadata.domain }
        }));

        const initialEdges: Edge[] = data.edges.map(e => ({
          id: `${e.source}-${e.target}-${e.relationshipType}`,
          source: e.source,
          target: e.target,
          label: e.relationshipType,
          animated: e.relationshipType === 'SEARCH_RESULT',
          style: { stroke: '#64748b' }
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
        
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch mind map');
      } finally {
        setLoading(false);
      }
    };

    fetchMap();
  }, [sessionId]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeData(node.data);
  }, []);

  if (loading) return <div className="p-6">Loading mind map...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="w-full h-full relative">
      {nodes.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-500">
          No data yet
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      )}
      
      {selectedNodeData && (
        <NodeDetailPanel 
          data={selectedNodeData} 
          onClose={() => setSelectedNodeData(null)} 
        />
      )}
    </div>
  );
}
