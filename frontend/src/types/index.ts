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

export interface ResearchGraphNode {
  id: string;
  type: string;
  label: string;
  metadata: Record<string, unknown>;
}

export interface ResearchGraphEdge {
  source: string;
  target: string;
  relationshipType: string;
  confidence: number;
  reason: string;
  sourceTimestamp: string | null;
  targetTimestamp: string | null;
  metadata: Record<string, unknown>;
}

export interface ResearchGraphData {
  sessionId: string;
  nodes: ResearchGraphNode[];
  edges: ResearchGraphEdge[];
}

export interface ResearchSearchResult {
  id: string;
  type: string;
  label: string;
  sessionId: string;
  timestamp: string;
  url: string | null;
  domain: string | null;
  visitCount: number;
  score: number;
  importanceScore: number;
  matchedTerms: string[];
  reasons: string[];
  metadata: Record<string, unknown>;
  graphContext: Array<{
    source: string;
    target: string;
    relationshipType: string;
    reason: string;
  }>;
}

export interface ResearchSearchData {
  query: string;
  normalizedQuery: string;
  totalResults: number;
  results: ResearchSearchResult[];
}
