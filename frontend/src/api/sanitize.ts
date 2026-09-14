import { Session } from '../types';

// Sessions arrive as unvalidated JSON (backend response or localStorage
// persisted by an older/researchStore fallback). A degraded or legacy record
// must never be able to crash the list filter or the render, so normalize every
// field consumers touch at the API boundary.
export const normalizeSession = (s: Session): Session => ({
  ...s,
  title: typeof s.title === 'string' && s.title.trim() ? s.title : 'Untitled research session',
  description: typeof s.description === 'string' ? s.description : '',
  status: s.status === 'ACTIVE' || s.status === 'COMPLETED' || s.status === 'ARCHIVED' ? s.status : 'COMPLETED',
  startTime: s.startTime && !Number.isNaN(Date.parse(s.startTime)) ? s.startTime : new Date().toISOString(),
  pageCount: Number(s.pageCount) || 0,
  searchCount: Number(s.searchCount) || 0,
  eventCount: Number(s.eventCount) || 0,
  entityCount: Number(s.entityCount) || 0
});

export const sanitizeSessions = (data: unknown): Session[] =>
  Array.isArray(data)
    ? data
        .filter((s): s is Session => Boolean(s && typeof s === 'object'))
        .map(normalizeSession)
    : [];