import { useEffect, useState } from 'react';

/**
 * TelemetryHUD — Sci-Fi HUD monitoring panels (Vitals, Audio Spectrum, Tool Telemetry).
 */
export function TelemetryHUD({
  messages = [],
  isRecording,
  isSpeaking,
  isLoading,
  audioLevel = 0,
}) {
  const [latency, setLatency] = useState(14);
  const [sessionTime, setSessionTime] = useState('00:00');

  // Session timer
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      setSessionTime(`${mins}:${secs}`);

      // Small jitter for sci-fi realism
      setLatency(12 + Math.floor(Math.sin(elapsed) * 4 + Math.random() * 3));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter recent tool messages
  const recentToolCalls = messages
    .filter((m) => m.role === 'tool' || m.metadata?.tool_name)
    .slice(-4)
    .reverse();

  return (
    <div className="hidden lg:grid grid-cols-2 gap-4 w-full max-w-6xl mx-auto px-4 pointer-events-none">
      {/* ── LEFT HUD: System Vitals & Live Audio Spectrum ── */}
      <div className="pointer-events-auto glass-light rounded-2xl p-4 border border-nova-border/70 backdrop-blur-xl shadow-[0_0_25px_rgba(0,243,255,0.04)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-nova-border/60 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold tracking-wider text-cyan-300 uppercase">
                Core Telemetry & Vitals
              </span>
            </div>
            <span className="text-[10px] font-mono text-nova-text-muted">
              T+{sessionTime}
            </span>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <div className="bg-nova-surface/60 rounded-xl p-2.5 border border-nova-border/40">
              <span className="text-[10px] font-mono text-nova-text-muted block">
                REASONING CORE
              </span>
              <span className="text-xs font-mono font-medium text-purple-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Claude Sonnet 3.5
              </span>
            </div>

            <div className="bg-nova-surface/60 rounded-xl p-2.5 border border-nova-border/40">
              <span className="text-[10px] font-mono text-nova-text-muted block">
                ORCHESTRATION
              </span>
              <span className="text-xs font-mono font-medium text-cyan-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                LangGraph Multi-Step
              </span>
            </div>

            <div className="bg-nova-surface/60 rounded-xl p-2.5 border border-nova-border/40">
              <span className="text-[10px] font-mono text-nova-text-muted block">
                SPEECH INTERFACE
              </span>
              <span className="text-xs font-mono font-medium text-emerald-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Whisper + ElevenLabs
              </span>
            </div>

            <div className="bg-nova-surface/60 rounded-xl p-2.5 border border-nova-border/40">
              <span className="text-[10px] font-mono text-nova-text-muted block">
                PIPELINE LATENCY
              </span>
              <span className="text-xs font-mono font-medium text-emerald-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {latency} ms • 48 kHz
              </span>
            </div>
          </div>
        </div>

        {/* Live Audio Frequency Spectrum Display */}
        <div className="bg-nova-bg/70 rounded-xl p-3 border border-nova-border/60">
          <div className="flex items-center justify-between text-[10px] font-mono text-nova-text-muted mb-2">
            <span>AUDIO SPECTRUM ANALYZER</span>
            <span className="text-cyan-400 font-medium">
              {isRecording ? 'MIC ENGAGED' : isSpeaking ? 'OUTPUT ACTIVE' : 'MONITORING'}
            </span>
          </div>

          <div className="flex items-end justify-between gap-1 h-10 px-1">
            {Array.from({ length: 24 }).map((_, idx) => {
              // Dynamic height based on recording/speaking/idle
              let heightPct = 15;
              if (isRecording) {
                heightPct = Math.min(
                  95,
                  15 + (audioLevel * 100 * (1 - Math.abs(idx - 12) / 12) + Math.random() * 35)
                );
              } else if (isSpeaking) {
                heightPct = Math.min(
                  90,
                  20 + Math.abs(Math.sin(idx * 0.4 + Date.now() * 0.005)) * 60 + Math.random() * 20
                );
              } else if (isLoading) {
                heightPct = 25 + Math.abs(Math.sin(idx * 0.6 + Date.now() * 0.008)) * 40;
              } else {
                heightPct = 12 + Math.abs(Math.sin(idx * 0.3)) * 14;
              }

              return (
                <div
                  key={idx}
                  className="flex-1 rounded-sm transition-all duration-75"
                  style={{
                    height: `${heightPct}%`,
                    background: isRecording
                      ? 'linear-gradient(to top, #00f3ff, #38bdf8)'
                      : isSpeaking
                      ? 'linear-gradient(to top, #10b981, #34d399)'
                      : isLoading
                      ? 'linear-gradient(to top, #8b5cf6, #c084fc)'
                      : 'linear-gradient(to top, #3b82f6, #6366f1)',
                    opacity: isRecording || isSpeaking || isLoading ? 0.9 : 0.4,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT HUD: Tool Execution Radar & Capability Matrix ── */}
      <div className="pointer-events-auto glass-light rounded-2xl p-4 border border-nova-border/70 backdrop-blur-xl shadow-[0_0_25px_rgba(139,92,246,0.04)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-nova-border/60 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold tracking-wider text-purple-300 uppercase">
                Active Capabilities & Tool Radar
              </span>
            </div>
            <span className="text-[10px] font-mono text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              6 ARMED TOOLS
            </span>
          </div>

          {/* Capabilities Badges */}
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            <div className="flex items-center gap-2 bg-nova-surface/60 rounded-xl p-2 border border-nova-border/40">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-xs">
                🌐
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono font-medium text-nova-text block truncate">
                  Web Intelligence
                </span>
                <span className="text-[10px] font-mono text-nova-text-muted">Tavily / DDG</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-nova-surface/60 rounded-xl p-2 border border-nova-border/40">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs">
                ⚡
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono font-medium text-nova-text block truncate">
                  Code Execution
                </span>
                <span className="text-[10px] font-mono text-nova-text-muted">Python Sandbox</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-nova-surface/60 rounded-xl p-2 border border-nova-border/40">
              <div className="w-7 h-7 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center text-xs">
                🎵
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono font-medium text-nova-text block truncate">
                  Media Control
                </span>
                <span className="text-[10px] font-mono text-nova-text-muted">Spotify API</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-nova-surface/60 rounded-xl p-2 border border-nova-border/40">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center text-xs">
                🧠
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono font-medium text-nova-text block truncate">
                  Vector Memory
                </span>
                <span className="text-[10px] font-mono text-nova-text-muted">pgvector RAG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Execution Stream / Recent Activities */}
        <div className="bg-nova-bg/70 rounded-xl p-3 border border-nova-border/60">
          <div className="flex items-center justify-between text-[10px] font-mono text-nova-text-muted mb-2">
            <span>TOOL EXECUTION STREAM</span>
            <span className="text-emerald-400 font-medium">READY</span>
          </div>

          <div className="space-y-1.5 max-h-20 overflow-y-auto">
            {recentToolCalls.length > 0 ? (
              recentToolCalls.map((call, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11px] font-mono bg-nova-surface-2/60 rounded-lg px-2.5 py-1.5 border border-nova-border/40"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-emerald-400">⚡</span>
                    <span className="text-nova-text font-medium truncate">
                      {call.metadata?.tool_name || 'execute_tool'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400/90 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                    COMPLETED
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[11px] font-mono text-nova-text-muted py-2 text-center">
                Awaiting commands • All systems calibrated
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
