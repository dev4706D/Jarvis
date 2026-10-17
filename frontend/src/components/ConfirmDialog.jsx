/**
 * ConfirmDialog — overlay for dangerous tool call approval/denial.
 */
export function ConfirmDialog({ confirmation, onConfirm, isLoading }) {
  if (!confirmation) return null;

  const toolDisplayNames = {
    tool_play_media: '🎵 Play Media',
    tool_run_code: '💻 Run Code',
  };

  const displayName = toolDisplayNames[confirmation.tool_name] || confirmation.tool_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative glass rounded-2xl p-6 max-w-md w-full animate-fade-in
                      shadow-2xl shadow-nova-accent/5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-nova-warning/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-nova-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-nova-text">Confirmation Required</h3>
            <p className="text-xs text-nova-text-muted">Nova wants to perform an action</p>
          </div>
        </div>

        {/* Tool Info */}
        <div className="bg-nova-surface-2 rounded-xl p-4 mb-4 border border-nova-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-nova-text">{displayName}</span>
          </div>
          <pre className="text-xs text-nova-text-secondary overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(confirmation.tool_input, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(false)}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-nova-border
                       text-nova-text-secondary text-sm font-medium
                       hover:bg-nova-surface-2 hover:text-nova-text
                       transition-all duration-200 disabled:opacity-50"
          >
            Deny
          </button>
          <button
            onClick={() => onConfirm(true)}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl
                       bg-nova-accent text-white text-sm font-medium
                       hover:bg-nova-accent-light
                       transition-all duration-200 disabled:opacity-50
                       flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
