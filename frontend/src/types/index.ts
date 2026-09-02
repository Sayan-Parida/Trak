export interface Session {
  id: string;
  title: string | null;
  status: string; // ACTIVE, COMPLETED, ABANDONED
  startTime: string;
  endTime: string | null;
  eventCount: number;
  pageCount: number;
  searchCount: number;
}

export interface PageVisit {
  id: string;
  url: string;
  domain: string;
  title: string;
  firstVisited: string;
  lastVisited: string;
  visitCount: number;
  durationMs: number;
}

export interface SearchQuery {
  id: string;
  queryText: string;
  engine: string;
  sourceUrl: string;
  timestamp: string;
}

export interface TimelineEntry {
  id: string;
  type: string; // EVENT or SEARCH
  timestamp: string;
  title: string;
  url: string;
  details: Record<string, unknown>;
}

export interface MindMapNode {
  id: string;
  type: string; // SEARCH or PAGE
  label: string;
  url: string;
  domain: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface MindMapEdge {
  source: string;
  target: string;
  relationship: string;
  description: string;
}

export interface MindMapData {
  sessionId: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}
