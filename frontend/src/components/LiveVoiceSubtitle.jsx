import { playBlip } from '../lib/audioSoundFx';

/**
 * LiveVoiceSubtitle — Clean, aesthetic speech subtitle and minimalist suggestion pills.
 */
export function LiveVoiceSubtitle({
  lastMessage,
  isRecording,
  isSpeaking,
  isLoading,
  onSelectPrompt,
}) {
  const suggestions = [
    { text: "What's the latest news in AI?" },
    { text: 'Play some relaxing synthwave' },
    { text: 'Run a Python prime calculation' },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-2 mb-4 text-center">
      {/* Dynamic Subtitle / Message Display */}
      {isRecording ? (
        <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-sky-300 text-sm">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>I'm listening...</span>
        </div>
      ) : isLoading ? (
        <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-purple-300 text-sm">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>Thinking...</span>
        </div>
      ) : lastMessage ? (
        <div className="animate-fade-in max-w-lg mx-auto text-center px-4 py-3 rounded-2xl glass-panel">
          <p className="text-xs text-white/40 mb-1 font-medium">
            {lastMessage.role === 'user' ? 'You' : 'Nova'}
          </p>
          <p className="text-sm text-white/90 leading-relaxed font-normal">
            {lastMessage.content}
          </p>
        </div>
      ) : (
        /* Minimalist suggestion pills */
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                playBlip();
                onSelectPrompt(item.text);
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-normal text-white/70 glass-pill hover:text-white transition-all cursor-pointer"
            >
              {item.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
