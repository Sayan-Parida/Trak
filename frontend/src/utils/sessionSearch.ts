import { apiClient } from '../api/client';
import { PageVisit, SearchQuery } from '../types';

export interface SearchResultPage {
  type: 'PAGE';
  id: string;
  title: string;
  url: string;
  domain: string;
  lastVisited: string;
}

export interface SearchResultSearch {
  type: 'SEARCH';
  id: string;
  queryText: string;
  timestamp: string;
  engine: string;
}

export interface SessionSearchResults {
  sessionId: string;
  pages: SearchResultPage[];
  searches: SearchResultSearch[];
  totalMatches: number;
}

const matchesTokens = (text: string, tokens: string[]): boolean => {
  const lower = text.toLowerCase();
  return tokens.every((t) => lower.includes(t));
};

export async function loadSessionData(sessionId: string): Promise<{ pages: PageVisit[]; searches: SearchQuery[] }> {
  const [pages, searches] = await Promise.all([
    apiClient.getPages(sessionId),
    apiClient.getSearches(sessionId),
  ]);
  return { pages, searches };
}

/**
 * Deterministic search scoped to a single session.
 *
 * Rules (no new research semantics):
 * - case-insensitive, AND-token substring matching,
 * - page title matches rank above URL/domain matches,
 * - results sorted by recency (lastVisited / timestamp desc),
 * - pages and searches only, for one session.
 */
export function searchSession(
  sessionId: string,
  query: string,
  pages: PageVisit[],
  searches: SearchQuery[]
): SessionSearchResults {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { sessionId, pages: [], searches: [], totalMatches: 0 };

  const titleMatches: SearchResultPage[] = [];
  const urlMatches: SearchResultPage[] = [];

  for (const page of pages) {
    const titleHit = matchesTokens(page.title, tokens);
    const urlHit = matchesTokens(page.url, tokens) || matchesTokens(page.domain, tokens);
    if (!titleHit && !urlHit) continue;

    const entry: SearchResultPage = {
      type: 'PAGE',
      id: page.id,
      title: page.title,
      url: page.url,
      domain: page.domain,
      lastVisited: page.lastVisited,
    };

    if (titleHit) titleMatches.push(entry);
    else urlMatches.push(entry);
  }

  titleMatches.sort((a, b) => +new Date(b.lastVisited) - +new Date(a.lastVisited));
  urlMatches.sort((a, b) => +new Date(b.lastVisited) - +new Date(a.lastVisited));

  const matchedSearches: SearchResultSearch[] = searches
    .filter((sq) => matchesTokens(sq.queryText, tokens))
    .map((sq): SearchResultSearch => ({ type: 'SEARCH', id: sq.id, queryText: sq.queryText, timestamp: sq.timestamp, engine: sq.engine }))
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  return {
    sessionId,
    pages: [...titleMatches, ...urlMatches],
    searches: matchedSearches,
    totalMatches: titleMatches.length + urlMatches.length + matchedSearches.length,
  };
}