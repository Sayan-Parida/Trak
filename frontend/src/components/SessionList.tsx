import { useEffect, useState } from 'react';
import { Session } from '../types';
import { apiClient } from '../api/client';

interface Props {
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
}

export default function SessionList({ selectedSessionId, onSelectSession }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await apiClient.getSessions();
      setSessions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && sessions.length === 0) {
    return <div className="p-4">Loading sessions...</div>;
  }

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white w-64 shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
        <h2 className="text-lg font-semibold">Sessions</h2>
        <button onClick={fetchSessions} className="text-sm text-blue-600 hover:underline">
          Refresh
        </button>
      </div>

      {error && <div className="p-4 text-red-500 text-sm">{error}</div>}

      {sessions.length === 0 && !error ? (
        <div className="p-4 text-gray-500 text-sm">No sessions yet</div>
      ) : (
        <div className="flex flex-col">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedSessionId === session.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 truncate pr-2">
                  {session.title || 'Untitled Session'}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    session.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : session.status === 'COMPLETED'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {session.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Started: {new Date(session.startTime).toLocaleString()}
              </div>
              <div className="flex space-x-3 text-xs text-gray-600">
                <span title="Pages">📄 {session.pageCount}</span>
                <span title="Searches">🔍 {session.searchCount}</span>
                <span title="Events">⚡ {session.eventCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
