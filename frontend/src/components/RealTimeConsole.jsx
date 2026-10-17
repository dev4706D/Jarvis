import { useState } from 'react';
import { playBlip, playChirp } from '../lib/audioSoundFx';

/**
 * RealTimeConsole — Floating minimalist glassmorphic voice & text bar.
 */
export function RealTimeConsole({
  onSend,
  onVoice,
  isLoading,
  isRecording,
  audioLevel = 0,
}) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      playChirp();
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
    <div className="w-full pb-6 px-4 pt-2 relative z-20">
      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto flex items-center gap-2 p-1.5 rounded-full glass-panel shadow-2xl border border-white/10 transition-all focus-within:border-white/20"
      >
        {/* Aesthetic Voice Mic Reactor */}
        <button
          type="button"
          onClick={() => {
            playBlip();
            onVoice();
          }}
          disabled={isLoading}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
            isRecording
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse scale-105'
              : 'bg-white/10 hover:bg-white/15 text-white/90'
          } disabled:opacity-30 cursor-pointer`}
          title={isRecording ? 'Stop recording' : 'Speak'}
        >
          {isRecording ? (
            <div className="w-3.5 h-3.5 rounded-xs bg-white" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        {/* Minimalist Input Field */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'Listening to your voice...' : 'Ask Nova anything...'}
          disabled={isLoading || isRecording}
          className="flex-1 bg-transparent px-3 text-sm text-white placeholder-white/40 focus:outline-none disabled:opacity-50 font-normal"
        />

        {/* Minimalist Send Arrow */}
        {text.trim() && (
          <button
            type="submit"
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:opacity-90 transition-all shrink-0 mr-0.5 cursor-pointer shadow-md"
            title="Send"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}
