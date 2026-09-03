import { 
  Session, 
  PageVisit, 
  SearchQuery, 
  TimelineEntry, 
  MindMapData, 
  ResearchGraphData, 
  ResearchSearchData 
} from '../types';
import { researchStore } from './researchStore';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const apiClient = {
  getSessions: async (): Promise<Session[]> => {
    try {
      return await fetchJson<Session[]>('/api/sessions');
    } catch {
      return researchStore.getSessions();
    }
  },

  getSession: async (id: string): Promise<Session> => {
    try {
      return await fetchJson<Session>(`/api/sessions/${id}`);
    } catch {
      const session = researchStore.getSession(id);
      if (!session) throw new Error(`Session ${id} not found`);
      return session;
    }
  },

  createSession: async (title?: string, description?: string, tags: string[] = []): Promise<Session> => {
    try {
      return await fetchJson<Session>('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, tags })
      });
    } catch {
      return researchStore.createSession(title, description, tags);
    }
  },

  updateSession: async (id: string, data: Partial<Session>): Promise<Session> => {
    try {
      return await fetchJson<Session>(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch {
      return researchStore.updateSession(id, data);
    }
  },

  deleteSession: async (id: string): Promise<void> => {
    try {
      await fetchJson(`/api/sessions/${id}`, { method: 'DELETE' });
    } catch {
      researchStore.deleteSession(id);
    }
  },

  getTimeline: async (id: string): Promise<TimelineEntry[]> => {
    try {
      return await fetchJson<TimelineEntry[]>(`/api/sessions/${id}/timeline`);
    } catch {
      return researchStore.getTimeline(id);
    }
  },

  getPages: async (id: string): Promise<PageVisit[]> => {
    try {
      return await fetchJson<PageVisit[]>(`/api/sessions/${id}/pages`);
    } catch {
      return researchStore.getPages(id);
    }
  },

  getSearches: async (id: string): Promise<SearchQuery[]> => {
    try {
      return await fetchJson<SearchQuery[]>(`/api/sessions/${id}/searches`);
    } catch {
      return researchStore.getSearches(id);
    }
  },

  getMindMap: async (id: string): Promise<MindMapData> => {
    try {
      return await fetchJson<MindMapData>(`/api/sessions/${id}/mindmap`);
    } catch {
      return researchStore.getMindMap(id);
    }
  },

  getResearchGraph: async (id: string): Promise<ResearchGraphData> => {
    try {
      return await fetchJson<ResearchGraphData>(`/api/sessions/${id}/research-graph`);
    } catch {
      return researchStore.getResearchGraph(id);
    }
  },

  searchResearch: async (query: string): Promise<ResearchSearchData> => {
    try {
      return await fetchJson<ResearchSearchData>(`/api/research/search?q=${encodeURIComponent(query)}`);
    } catch {
      return researchStore.searchAcrossResearch(query);
    }
  },

  executeDeepResearch: async (
    sessionId: string, 
    query: string, 
    onProgress?: (step: number, message: string) => void
  ) => {
    return researchStore.executeDeepResearch(sessionId, query, onProgress);
  }
};
