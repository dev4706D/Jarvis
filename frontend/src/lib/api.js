/**
 * Nova API Client — all backend communication in one place.
 */

const API_BASE = '/api';

/**
 * Send a text message and get the assistant's response.
 */
export async function sendMessage(message, conversationId = null) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.statusText}`);
  return res.json();
}

/**
 * Send audio for voice chat (STT → orchestrator → response + TTS).
 */
export async function sendVoice(audioBlob, conversationId = null) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  if (conversationId) {
    formData.append('conversation_id', conversationId);
  }

  const res = await fetch(`${API_BASE}/chat/voice`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Voice chat failed: ${res.statusText}`);
  return res.json();
}

/**
 * Approve or deny a pending tool execution.
 */
export async function confirmAction(conversationId, toolCallId, approved) {
  const res = await fetch(`${API_BASE}/chat/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: conversationId,
      tool_call_id: toolCallId,
      approved,
    }),
  });
  if (!res.ok) throw new Error(`Confirmation failed: ${res.statusText}`);
  return res.json();
}

/**
 * Teach Nova a fact/preference manually.
 */
export async function teachFact(content, category = 'general') {
  const res = await fetch(`${API_BASE}/memory/teach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, category }),
  });
  if (!res.ok) throw new Error(`Teach failed: ${res.statusText}`);
  return res.json();
}

/**
 * Search stored memories.
 */
export async function searchMemories(query, topK = 5, category = null) {
  const params = new URLSearchParams({ q: query, top_k: topK });
  if (category) params.append('category', category);

  const res = await fetch(`${API_BASE}/memory/search?${params}`);
  if (!res.ok) throw new Error(`Memory search failed: ${res.statusText}`);
  return res.json();
}

/**
 * Get list of conversations.
 */
export async function getConversations() {
  const res = await fetch(`${API_BASE}/conversations`);
  if (!res.ok) throw new Error(`Failed to get conversations: ${res.statusText}`);
  return res.json();
}

/**
 * Get messages for a specific conversation.
 */
export async function getConversation(conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`);
  if (!res.ok) throw new Error(`Failed to get conversation: ${res.statusText}`);
  return res.json();
}

/**
 * Convert text to speech (returns audio blob or null).
 */
export async function synthesizeSpeech(text, voiceId = null) {
  const res = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice_id: voiceId }),
  });

  if (!res.ok) throw new Error(`TTS failed: ${res.statusText}`);

  const contentType = res.headers.get('Content-Type');
  if (contentType && contentType.includes('audio')) {
    return res.blob();
  }
  return null; // Fallback to browser TTS
}

/**
 * Health check.
 */
export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
