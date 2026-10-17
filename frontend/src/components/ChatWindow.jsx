import { useEffect, useRef, useState } from 'react';

/**
 * ChatWindow — Clean, aesthetic conversation stream with subtle glassmorphic styling.
 */
export function ChatWindow({ messages, isLoading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-white/80 mb-1">
            No messages yet
          </h3>
          <p className="text-xs text-white/40 leading-relaxed">
            Speak or type a message below to begin your conversation with Nova.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble key={msg.id || index} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={endRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const [isToolExpanded, setIsToolExpanded] = useState(false);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="rounded-2xl rounded-tr-xs px-4 py-3 max-w-[80%] bg-indigo-600/30 border border-indigo-400/20 text-white shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
            {message.content}
          </p>
          {message.metadata?.source === 'voice' && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-300/70">
              <span>Voice</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.role === 'tool') {
    return (
      <div className="animate-fade-in max-w-[85%]">
        <button
          onClick={() => setIsToolExpanded(!isToolExpanded)}
          className="w-full text-left rounded-xl px-3.5 py-2 glass-pill text-xs hover:border-white/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">⚡</span>
            <span className="font-medium text-white/80">
              {message.metadata?.tool_name || 'Tool'}
            </span>
            <span className="text-[10px] text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {message.metadata?.status === 'success' ? 'Completed' : 'Running'}
            </span>
            <svg
              className={`w-3 h-3 text-white/40 ml-auto transition-transform ${
                isToolExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isToolExpanded && (
            <div className="mt-2.5 pt-2 border-t border-white/10 text-xs font-mono">
              {message.content && (
                <pre className="bg-black/30 rounded-lg p-2 text-white/70 overflow-x-auto text-[11px] max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {message.content}
                </pre>
              )}
            </div>
          )}
        </button>
      </div>
    );
  }

  // Assistant response
  return (
    <div className="animate-fade-in max-w-[85%]">
      <div className="rounded-2xl rounded-tl-xs px-4 py-3 glass-panel border border-white/10 text-white/90">
        <p className="text-xs text-white/40 mb-1 font-medium">Nova</p>
        <div className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
          {message.content}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="animate-fade-in">
      <div className="rounded-2xl rounded-tl-xs px-4 py-2.5 glass-panel inline-flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
