
export default function NodeDetailPanel({ data, onClose }: { data: any; onClose: () => void }) {
  if (!data) return null;

  return (
    <div className="absolute top-4 right-4 w-80 bg-white border border-gray-200 shadow-xl rounded-lg flex flex-col z-10 max-h-[80%] overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <span className="mr-2">{data.type === 'SEARCH' ? '🔍' : '📄'}</span>
          {data.type === 'SEARCH' ? 'Search Query' : 'Page Visit'}
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:bg-gray-200 rounded p-1"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 text-sm space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title / Query</label>
          <div className="font-medium">{data.label}</div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
            {data.url}
          </a>
        </div>

        {data.domain && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Domain</label>
            <div>{data.domain}</div>
          </div>
        )}

        {data.timestamp && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Timestamp</label>
            <div>{new Date(data.timestamp).toLocaleString()}</div>
          </div>
        )}
        
        {data.metadata && Object.entries(data.metadata).map(([key, value]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
            <div>{String(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
