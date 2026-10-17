import { useCallback, useState } from 'react';
import { confirmAction, getConversation, sendMessage, sendVoice } from '../lib/api';

/**
 * useChat — manages chat state, message sending, and conversation loading.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Send a text message.
   */
  const send = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    // Add user message immediately
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await sendMessage(text, conversationId);

      // Update conversation ID if new
      if (result.conversation_id) {
        setConversationId(result.conversation_id);
      }

      // Add tool call messages if any
      if (result.tool_calls?.length > 0) {
        const toolMsgs = result.tool_calls.map((tc, i) => ({
          id: `tool-${Date.now()}-${i}`,
          role: 'tool',
          content: tc.output || '',
          metadata: { tool_name: tc.tool_name, input: tc.input, status: tc.status },
          created_at: new Date().toISOString(),
        }));
        setMessages(prev => [...prev, ...toolMsgs]);
      }

      // Add assistant response
      if (result.response) {
        const assistantMsg = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.response,
          audio: result.audio,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      }

      // Handle pending confirmation
      if (result.pending_confirmation) {
        setPendingConfirmation(result.pending_confirmation);
      }

      return result;
    } catch (err) {
      setError(err.message);
      const errorMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message}`,
        isError: true,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isLoading]);

  /**
   * Send voice audio.
   */
  const sendAudio = useCallback(async (audioBlob) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendVoice(audioBlob, conversationId);

      if (result.conversation_id) {
        setConversationId(result.conversation_id);
      }

      // Add transcribed user message
      if (result.transcript) {
        setMessages(prev => [...prev, {
          id: `user-${Date.now()}`,
          role: 'user',
          content: result.transcript,
          metadata: { source: 'voice' },
          created_at: new Date().toISOString(),
        }]);
      }

      // Add tool calls
      if (result.tool_calls?.length > 0) {
        const toolMsgs = result.tool_calls.map((tc, i) => ({
          id: `tool-${Date.now()}-${i}`,
          role: 'tool',
          content: tc.output || '',
          metadata: { tool_name: tc.tool_name, input: tc.input, status: tc.status },
          created_at: new Date().toISOString(),
        }));
        setMessages(prev => [...prev, ...toolMsgs]);
      }

      // Add assistant response
      if (result.response) {
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.response,
          audio: result.audio,
          created_at: new Date().toISOString(),
        }]);
      }

      if (result.pending_confirmation) {
        setPendingConfirmation(result.pending_confirmation);
      }

      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  /**
   * Handle tool confirmation (approve/deny).
   */
  const handleConfirm = useCallback(async (approved) => {
    if (!pendingConfirmation) return;
    setIsLoading(true);

    try {
      const result = await confirmAction(
        conversationId,
        pendingConfirmation.tool_call_id,
        approved
      );

      setPendingConfirmation(null);

      if (result.response) {
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.response,
          audio: result.audio,
          created_at: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, pendingConfirmation]);

  /**
   * Load an existing conversation.
   */
  const loadConversation = useCallback(async (convId) => {
    try {
      const result = await getConversation(convId);
      setConversationId(convId);
      setMessages(result.messages || []);
      setPendingConfirmation(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  /**
   * Start a new conversation.
   */
  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setPendingConfirmation(null);
    setError(null);
  }, []);

  return {
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
  };
}
