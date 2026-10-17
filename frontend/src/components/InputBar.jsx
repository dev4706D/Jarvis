import { useState } from 'react';
import { VoiceButton } from './VoiceButton';

/**
 * InputBar — text input with send button and microphone toggle.
 */
export function InputBar({ onSend, onVoice, isLoading, isRecording }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="border-t border-nova-border bg-nova-surface/80 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
        <div className="flex items-end gap-3">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Nova..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none rounded-2xl px-4 py-3 pr-12
                         bg-nova-surface-2 border border-nova-border 
                         text-nova-text text-sm placeholder-nova-text-muted
                         focus:outline-none focus:border-nova-accent/40 focus:ring-1 focus:ring-nova-accent/20
                         disabled:opacity-50 transition-all duration-200
                         max-h-36 overflow-y-auto"
              style={{ minHeight: '48px' }}
              onInput={(e) => {
                e.target.style.height = '48px';
                e.target.style.height = Math.min(e.target.scrollHeight, 144) + 'px';
              }}
            />

            {/* Send Button (inside input) */}
            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className="absolute right-2 bottom-2 w-8 h-8 rounded-lg
                         bg-nova-accent text-white
                         flex items-center justify-center
                         hover:bg-nova-accent-light disabled:opacity-30
                         transition-all duration-200
                         disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Voice Button */}
          <VoiceButton
            onVoice={onVoice}
            isLoading={isLoading}
            isRecording={isRecording}
          />
        </div>

        {/* Keyboard hint */}
        <p className="text-[10px] text-nova-text-muted mt-2 text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-nova-surface-3 text-nova-text-secondary">Enter</kbd> to send, 
          <kbd className="px-1 py-0.5 rounded bg-nova-surface-3 text-nova-text-secondary ml-1">Shift+Enter</kbd> for new line
        </p>
      </form>
    </div>
  );
}
