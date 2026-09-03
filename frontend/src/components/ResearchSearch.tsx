import { FormEvent, useState } from 'react';
import { apiClient } from '../api/client';
import { ResearchSearchData, ResearchSearchResult } from '../types';

interface Props {
  onOpenSession: (sessionId: string) => void;
}

function Result({ result, onOpenSession }: { result: ResearchSearchResult; onOpenSession: (sessionId: string) => void }) {
  return (
    <article className="border rounded bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{result.type}</div>
          <h3 className="font-medium text-gray-900">{result.label}</h3>
          {result.url && <div className="mt-1 break-all text-sm text-blue-600">{result.url}</div>}
        </div>
        <div className="shrink-0 text-right text-sm text-gray-500">
          <div>Score {result.score.toFixed(2)}</div>
          <div>Importance {result.importanceScore.toFixed(2)}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
        {result.matchedTerms.map(term => <span key={term} className="rounded bg-gray-100 px-2 py-1">{term}</span>)}
        {result.visitCount > 0 && <span className="rounded bg-gray-100 px-2 py-1">{result.visitCount} visits</span>}
        <span className="rounded bg-gray-100 px-2 py-1">Session {result.sessionId.slice(0, 8)}</span>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
        {result.reasons.map(reason => <li key={reason}>{reason}</li>)}
      </ul>
      {result.graphContext.length > 0 && (
        <div className="mt-3 text-xs text-gray-500">
          {result.graphContext.length} related research-graph relationships: {result.graphContext.slice(0, 3).map(edge => edge.relationshipType).join(', ')}
        </div>
      )}
      <button
        type="button"
        onClick={() => onOpenSession(result.sessionId)}
        className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Open session
      </button>
    </article>
  );
}

export default function ResearchSearch({ onOpenSession }: Props) {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<ResearchSearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setData(await apiClient.searchResearch(query));
    } catch (requestError: any) {
      setError(requestError.message || 'Research search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-b border-gray-200 bg-gray-50 px-6 py-4">
      <form onSubmit={submit} className="mx-auto flex max-w-5xl gap-3">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search your research"
          aria-label="Search your research"
          className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <p className="mx-auto mt-3 max-w-5xl text-sm text-red-600">{error}</p>}
      {data && (
        <div className="mx-auto mt-4 max-w-5xl">
          <div className="mb-3 text-sm text-gray-600">{data.totalResults} research results for &quot;{data.normalizedQuery}&quot;</div>
          {data.results.length === 0 ? <p className="text-sm text-gray-500">No matching research evidence found.</p> : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {data.results.map(result => <Result key={result.id} result={result} onOpenSession={onOpenSession} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
