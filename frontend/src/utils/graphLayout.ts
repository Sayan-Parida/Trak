import dagre from '@dagrejs/dagre';

// Canonical dimensions used for every node during layout. Fixed values keep the
// layout a pure function of the graph structure (ids + edges), independent of
// rendered sizes, viewport, or previous visual state.
export const LAYOUT_NODE_WIDTH = 240;
export const LAYOUT_NODE_HEIGHT = 100;

// Only these relationships constrain the canonical layout. Every other edge
// (CONTAINS, MENTIONED_IN, hidden domain edges, â€¦) is still rendered, but must
// not move nodes around.
export const LAYOUT_RELATIONSHIPS: ReadonlySet<string> = new Set([
  'SEARCH_TO_SEARCH',
  'RESULTS_IN',
  'PAGE_TO_PAGE',
  'NAVIGATED_FROM'
]);

export interface CanonicalLayoutEdge {
  source: string;
  target: string;
  relationship: string;
}

const PAIR_SEP = '\u0001';

/**
 * ONE canonical layout for the Research Map.
 *
 * Deterministic: identical (node ids, edges) always produce identical
 * positions. Inputs are normalized (deduped + sorted) before layout so the
 * result never depends on backend ordering, React state ordering, hidden
 * flags, selection, viewport, time, or previous node positions.
 *
 * Both the initial graph load and "Reset Node Layout" must call this with the
 * same inputs â€” that is what guarantees fresh load == reset == refresh.
 */
export function layoutResearchGraph(
  nodeIds: string[],
  edges: CanonicalLayoutEdge[],
  direction: 'LR' | 'TB' = 'LR'
): Record<string, { x: number; y: number }> {
  const ids = [...new Set(nodeIds)].sort();

  const seen = new Set<string>();
  const pairs: Array<[string, string]> = [];
  for (const edge of edges) {
    if (!LAYOUT_RELATIONSHIPS.has(edge.relationship)) continue;
    const key = edge.source + PAIR_SEP + edge.target;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push([edge.source, edge.target]);
  }
  pairs.sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0
  );

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // Guard against edges that reference unknown nodes: give them the same fixed
  // size instead of letting dagre compute with undefined dimensions.
  dagreGraph.setDefaultNodeLabel(() => ({ width: LAYOUT_NODE_WIDTH, height: LAYOUT_NODE_HEIGHT }));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 35,
    ranksep: 40,
    marginx: 30,
    marginy: 30
  });

  for (const id of ids) {
    dagreGraph.setNode(id, { width: LAYOUT_NODE_WIDTH, height: LAYOUT_NODE_HEIGHT });
  }
  for (const [source, target] of pairs) {
    dagreGraph.setEdge(source, target);
  }

  dagre.layout(dagreGraph);

  const positions: Record<string, { x: number; y: number }> = {};
  for (const id of ids) {
    const nodeWithPosition = dagreGraph.node(id) || { x: 0, y: 0 };
    positions[id] = {
      x: nodeWithPosition.x - LAYOUT_NODE_WIDTH / 2,
      y: nodeWithPosition.y - LAYOUT_NODE_HEIGHT / 2
    };
  }
  return positions;
}
