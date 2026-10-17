import { useCallback, useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ConfirmDialog } from './components/ConfirmDialog';
import { HolographicCore } from './components/HolographicCore';
import { LiveVoiceSubtitle } from './components/LiveVoiceSubtitle';
import { RealTimeConsole } from './components/RealTimeConsole';
import { Sidebar } from './components/Sidebar';
import { TeachPanel } from './components/TeachPanel';
import { useChat } from './hooks/useChat';
import { useVoice } from './hooks/useVoice';
import { getSoundEnabled, playBlip, playChirp, setSoundEnabled } from './lib/audioSoundFx';

function App() {
  const [showTeach, setShowTeach] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [mode, setMode] = useState('voice'); // 'voice' | 'chat'
  const [sfxActive, setSfxActive] = useState(getSoundEnabled());

  const {
    messages,
    conversationId,
    isLoading,
    pendingConfirmation,
    error,
    send,
    sendAudio,
    handleConfirm,
    loadConversation,
    newConversation,
  } = useChat();

  const {
    isRecording,
    isSpeaking,
    audioLevel,
    analyserRef,
    startRecording,
    stopRecording,
    playResponse,
    stopSpeaking,
  } = useVoice();

  // Toggle voice recording
  const handleVoiceToggle = useCallback(async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob && audioBlob.size > 0) {
        const result = await sendAudio(audioBlob);
        if (result?.response) {
          await playResponse(result.response, result.audio);
        }
      }
    } else {
      await startRecording();
    }
  }, [isRecording, stopRecording, startRecording, sendAudio, playResponse]);

  // Handle text directive send
  const handleSend = useCallback(
    async (text) => {
      const result = await send(text);
      if (result?.audio) {
        await playResponse(result.response, result.audio);
      }
    },
    [send, playResponse]
  );

  // Toggle sound FX
  const handleToggleSfx = () => {
    const next = !sfxActive;
    setSfxActive(next);
    setSoundEnabled(next);
    if (next) playChirp();
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="flex h-screen w-screen aesthetic-bg text-nova-text overflow-hidden select-none">
      {/* Optional Conversation History Sidebar */}
      {showSidebar && (
        <Sidebar
          currentId={conversationId}
          onSelect={(id) => {
            loadConversation(id);
            playBlip();
          }}
          onNewChat={() => {
            newConversation();
            playChirp();
          }}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Minimalist Top Header */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0 z-30">
          {/* Left: Brand / Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowSidebar(!showSidebar);
                playBlip();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Chat History"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-sm font-medium tracking-wide text-white/90">Nova</span>
            </div>
          </div>

          {/* Center: Mode Switcher (Voice / Chat) */}
          <div className="flex items-center p-1 rounded-full glass-pill text-xs">
            <button
              onClick={() => {
                setMode('voice');
                playBlip();
              }}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer font-medium ${
                mode === 'voice' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              Voice
            </button>
            <button
              onClick={() => {
                setMode('chat');
                playBlip();
              }}
              className={`px-3.5 py-1 rounded-full transition-all cursor-pointer font-medium ${
                mode === 'chat' ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              Chat
            </button>
          </div>

          {/* Right: Sound & Teach Memory */}
          <div className="flex items-center gap-1.5">
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-1.5 hover:bg-rose-500/30 transition-all cursor-pointer mr-1"
              >
                <span>Stop</span>
              </button>
            )}

            <button
              onClick={handleToggleSfx}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Toggle Sound Effects"
            >
              <span className="text-sm">{sfxActive ? '🔊' : '🔇'}</span>
            </button>

            <button
              onClick={() => {
                setShowTeach(!showTeach);
                playBlip();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Teach Nova"
            >
              <span className="text-sm">🧠</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-between min-h-0 relative overflow-hidden">
          {mode === 'voice' ? (
            /* Aesthetic Voice Center View */
            <div className="flex-1 flex flex-col items-center justify-center my-auto px-4">
              <HolographicCore
                isRecording={isRecording}
                isSpeaking={isSpeaking}
                isLoading={isLoading}
                audioLevel={audioLevel}
                analyserRef={analyserRef}
                onCoreClick={handleVoiceToggle}
              />

              <LiveVoiceSubtitle
                lastMessage={lastMessage}
                isRecording={isRecording}
                isSpeaking={isSpeaking}
                isLoading={isLoading}
                onSelectPrompt={handleSend}
              />
            </div>
          ) : (
            /* Clean Chat View */
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 py-2">
              <ChatWindow messages={messages} isLoading={isLoading} />
            </div>
          )}

          {/* Floating Aesthetic Bottom Command Bar */}
          <RealTimeConsole
            onSend={handleSend}
            onVoice={handleVoiceToggle}
            isLoading={isLoading}
            isRecording={isRecording}
            audioLevel={audioLevel}
          />

          {/* Teach Memory Panel */}
          <TeachPanel isOpen={showTeach} onClose={() => setShowTeach(false)} />
        </div>
      </div>

      {/* Confirmation Dialog for sensitive tools */}
      <ConfirmDialog
        confirmation={pendingConfirmation}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;
