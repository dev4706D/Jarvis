/**
 * VoiceButton — microphone toggle with recording animation.
 */
export function VoiceButton({ onVoice, isLoading, isRecording }) {
  return (
    <button
      type="button"
      onClick={onVoice}
      disabled={isLoading}
      className={`w-12 h-12 rounded-2xl flex items-center justify-center
                  transition-all duration-300 shrink-0
                  ${isRecording
                    ? 'bg-nova-error animate-recording shadow-lg shadow-nova-error/20'
                    : 'bg-nova-surface-2 border border-nova-border hover:bg-nova-surface-3 hover:border-nova-accent/30'
                  }
                  disabled:opacity-30 disabled:cursor-not-allowed`}
      title={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? (
        /* Stop icon */
        <div className="w-4 h-4 rounded-sm bg-white" />
      ) : (
        /* Microphone icon */
        <svg className="w-5 h-5 text-nova-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}

      {/* Recording waveform */}
      {isRecording && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="waveform-bar bg-nova-error"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
