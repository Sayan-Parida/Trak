import { Session, PageVisit, SearchQuery, TimelineEntry, MindMapData, ResearchGraphData } from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const apiClient = {
  getSessions: () => fetchJson<Session[]>('/api/sessions'),
  getSession: (id: string) => fetchJson<Session>(`/api/sessions/${id}`),
  createSession: (title?: string) => fetchJson<Session>('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  }),
  updateSession: (id: string, data: Partial<Session>) => fetchJson<Session>(`/api/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  getTimeline: (id: string) => fetchJson<TimelineEntry[]>(`/api/sessions/${id}/timeline`),
  getPages: (id: string) => fetchJson<PageVisit[]>(`/api/sessions/${id}/pages`),
  getSearches: (id: string) => fetchJson<SearchQuery[]>(`/api/sessions/${id}/searches`),
  getMindMap: (id: string) => fetchJson<MindMapData>(`/api/sessions/${id}/mindmap`)
  ,getResearchGraph: (id: string) => fetchJson<ResearchGraphData>(`/api/sessions/${id}/research-graph`)
};
