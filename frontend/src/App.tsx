import { useState } from 'react';
import SessionList from './components/SessionList';
import Timeline from './components/Timeline';
import MindMap from './components/MindMap';
import { PageVisit } from './types';
import { apiClient } from './api/client';
import { useEffect } from 'react';

function PagesView({ sessionId }: { sessionId: string }) {
  const [pages, setPages] = useState<PageVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getPages(sessionId)
      .then(setPages)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="p-6">Loading pages...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Pages</h2>
      <div className="space-y-3">
        {pages.map(page => (
          <div key={page.id} className="p-4 border rounded shadow-sm bg-white">
            <h3 className="font-medium text-lg mb-1">{page.title || 'Untitled'}</h3>
            <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all block mb-2">
              {page.url}
            </a>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Domain: {page.domain}</span>
              <span>Visits: {page.visitCount}</span>
              <span>Time spent: {Math.round(page.durationMs / 1000)}s</span>
            </div>
          </div>
        ))}
        {pages.length === 0 && <p className="text-gray-500">No pages visited yet.</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'mindmap' | 'pages'>('mindmap');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <SessionList 
        selectedSessionId={selectedSessionId} 
        onSelectSession={setSelectedSessionId} 
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        {!selectedSessionId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <div className="text-4xl mb-4">🧠</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to ResearchMind</h1>
              <p className="text-gray-600">Select a session from the sidebar to view its mind map, timeline, and visited pages.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex space-x-6 shrink-0">
              <button 
                onClick={() => setActiveTab('mindmap')}
                className={`pb-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'mindmap' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Mind Map
              </button>
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`pb-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Timeline
              </button>
              <button 
                onClick={() => setActiveTab('pages')}
                className={`pb-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'pages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Pages
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'mindmap' && <MindMap sessionId={selectedSessionId} />}
              {activeTab === 'timeline' && <Timeline sessionId={selectedSessionId} />}
              {activeTab === 'pages' && <PagesView sessionId={selectedSessionId} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
