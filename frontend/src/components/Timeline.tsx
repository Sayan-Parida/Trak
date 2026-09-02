import { useEffect, useState } from 'react';
import { TimelineEntry } from '../types';
import { apiClient } from '../api/client';

interface Props {
  sessionId: string;
}

export default function Timeline({ sessionId }: Props) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await apiClient.getTimeline(sessionId);
        setEntries(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch timeline');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
    const interval = setInterval(fetchTimeline, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading && entries.length === 0) return <div className="p-6">Loading timeline...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Timeline</h2>
      {entries.length === 0 ? (
        <p className="text-gray-500">No events yet.</p>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {entries.map((entry) => (
            <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                {entry.type === 'SEARCH' ? '🔍' : '📄'}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-slate-900">{entry.type === 'SEARCH' ? 'Search' : 'Page Visit'}</div>
                  <time className="text-xs font-medium text-slate-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </time>
                </div>
                <div className="text-sm text-slate-500 mb-2">
                  {entry.title || entry.url}
                </div>
                <a href={entry.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                  {entry.url}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
