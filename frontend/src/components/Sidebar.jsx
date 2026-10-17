import { useEffect, useState } from 'react';
import { getConversations } from '../lib/api';

/**
 * Sidebar — conversation history + new chat button.
 */
export function Sidebar({ currentId, onSelect, onNewChat }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [currentId]);

  async function loadConversations() {
    setIsLoading(true);
    try {
      const data = await getConversations();
      setConversations(data.conversations || []);
    } catch {
      // Silent fail — sidebar is non-critical
    } finally {
      setIsLoading(false);
    }
  }

  function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  return (
    <aside className="w-72 h-full flex flex-col border-r border-nova-border bg-nova-surface shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-nova-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nova-accent to-purple-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <div>
            <h1 className="font-semibold text-nova-text text-base">Nova</h1>
            <p className="text-xs text-nova-text-muted">AI Assistant</p>
          </div>
        </div>

        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-xl border border-nova-border bg-nova-surface-2 
                     text-nova-text-secondary text-sm font-medium
                     hover:bg-nova-surface-3 hover:text-nova-text hover:border-nova-accent/30
                     transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && conversations.length === 0 ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl skeleton" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-nova-text-muted text-sm">No conversations yet</p>
            <p className="text-nova-text-muted text-xs mt-1">Start by typing a message</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200
                  ${conv.id === currentId
                    ? 'bg-nova-accent/10 border border-nova-accent/20 text-nova-text'
                    : 'hover:bg-nova-surface-2 text-nova-text-secondary hover:text-nova-text border border-transparent'
                  }`}
              >
                <p className="text-sm font-medium truncate">{conv.title || 'Untitled'}</p>
                <p className="text-xs text-nova-text-muted mt-0.5">{formatTime(conv.created_at)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-nova-border">
        <div className="flex items-center gap-2 text-xs text-nova-text-muted px-2">
          <div className="w-2 h-2 rounded-full bg-nova-success animate-pulse" />
          <span>Nova v0.1 • Local</span>
        </div>
      </div>
    </aside>
  );
}
