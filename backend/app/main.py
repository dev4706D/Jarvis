"""
Nova API — FastAPI application connecting the UI, orchestrator, tools, and database.

Endpoints:
  POST /api/chat              — Send text message (SSE streaming response)
  POST /api/chat/voice        — Upload audio → STT → orchestrator → response + TTS
  POST /api/chat/confirm      — Approve/deny a pending tool execution
  POST /api/memory/teach      — Manually store a fact/preference
  GET  /api/memory/search     — Search stored memories
  GET  /api/conversations     — List past conversations
  GET  /api/conversations/:id — Get conversation history
  POST /api/tts               — Convert text to speech audio
  GET  /api/health            — Health check
"""

import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select

from app.config import get_settings
from app.database import (
    Conversation,
    Message,
    Preference,
    async_session,
    create_conversation,
    get_all_preferences,
    get_conversation_messages,
    log_message,
    set_preference,
)
from app.memory import recall_memories, store_memory
from app.orchestrator import process_confirmation, process_message
from app.stt import transcribe
from app.tts import synthesize

logger = logging.getLogger(__name__)
settings = get_settings()

# ── FastAPI App ──
app = FastAPI(
    title="Nova AI Assistant",
    description="Personal AI voice/text assistant API",
    version="0.1.0",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# Request / Response Models
# ═══════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class ConfirmRequest(BaseModel):
    conversation_id: str
    tool_call_id: str
    approved: bool


class TeachRequest(BaseModel):
    content: str
    category: str = "general"


class PreferenceRequest(BaseModel):
    key: str
    value: str


class TTSRequest(BaseModel):
    text: str
    voice_id: str | None = None


# ═══════════════════════════════════════════════════════════════
# Chat Endpoints
# ═══════════════════════════════════════════════════════════════

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Send a text message and receive the assistant's response."""
    try:
        # Get or create conversation
        conv_id = request.conversation_id
        if not conv_id:
            async with async_session() as session:
                conv = await create_conversation(session, title=request.message[:100])
                await session.commit()
                conv_id = str(conv.id)

        # Load conversation history
        history = await _load_history(conv_id)

        # Process through orchestrator
        result = await process_message(
            user_message=request.message,
            conversation_id=conv_id,
            history=history,
        )

        # Generate TTS if enabled
        audio_base64 = None
        if result["response"]:
            audio_bytes = await synthesize(result["response"])
            if audio_bytes:
                import base64
                audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        return {
            "conversation_id": conv_id,
            "response": result["response"],
            "tool_calls": result["tool_calls"],
            "pending_confirmation": result["pending_confirmation"],
            "audio": audio_base64,
        }

    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/voice")
async def chat_voice(
    audio: UploadFile = File(...),
    conversation_id: str | None = Form(None),
):
    """Upload audio, transcribe with Whisper, process through orchestrator, return response + TTS."""
    try:
        # Read audio file
        audio_bytes = await audio.read()
        filename = audio.filename or "audio.webm"

        # Transcribe
        transcript = await transcribe(audio_bytes, filename)

        if not transcript:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")

        # Get or create conversation
        conv_id = conversation_id
        if not conv_id:
            async with async_session() as session:
                conv = await create_conversation(session, title=transcript[:100])
                await session.commit()
                conv_id = str(conv.id)

        # Load history and process
        history = await _load_history(conv_id)

        result = await process_message(
            user_message=transcript,
            conversation_id=conv_id,
            history=history,
        )

        # Generate TTS
        audio_base64 = None
        if result["response"]:
            tts_bytes = await synthesize(result["response"])
            if tts_bytes:
                import base64
                audio_base64 = base64.b64encode(tts_bytes).decode("utf-8")

        return {
            "conversation_id": conv_id,
            "transcript": transcript,
            "response": result["response"],
            "tool_calls": result["tool_calls"],
            "pending_confirmation": result["pending_confirmation"],
            "audio": audio_base64,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/confirm")
async def confirm_action(request: ConfirmRequest):
    """Approve or deny a pending tool execution."""
    try:
        history = await _load_history(request.conversation_id)

        result = await process_confirmation(
            conversation_id=request.conversation_id,
            tool_call_id=request.tool_call_id,
            approved=request.approved,
            history=history,
        )

        # Generate TTS
        audio_base64 = None
        if result["response"]:
            tts_bytes = await synthesize(result["response"])
            if tts_bytes:
                import base64
                audio_base64 = base64.b64encode(tts_bytes).decode("utf-8")

        return {
            "conversation_id": request.conversation_id,
            "response": result["response"],
            "tool_calls": result["tool_calls"],
            "pending_confirmation": result["pending_confirmation"],
            "audio": audio_base64,
        }

    except Exception as e:
        logger.error(f"Confirmation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# Memory Endpoints
# ═══════════════════════════════════════════════════════════════

@app.post("/api/memory/teach")
async def teach(request: TeachRequest):
    """Manually store a fact or preference in Nova's memory."""
    try:
        async with async_session() as session:
            memory_id = await store_memory(session, request.content, request.category)
            return {
                "id": memory_id,
                "content": request.content,
                "category": request.category,
                "status": "stored",
            }
    except Exception as e:
        logger.error(f"Teach error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/memory/search")
async def search_memories(
    q: str = Query(..., description="Search query"),
    top_k: int = Query(5, ge=1, le=20),
    category: str | None = Query(None),
):
    """Search stored memories by semantic similarity."""
    try:
        async with async_session() as session:
            results = await recall_memories(session, q, top_k=top_k, category=category)
            return {"query": q, "results": results}
    except Exception as e:
        logger.error(f"Memory search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/preferences")
async def update_preference(request: PreferenceRequest):
    """Set a user preference."""
    try:
        async with async_session() as session:
            await set_preference(session, request.key, request.value)
            await session.commit()
            return {"key": request.key, "value": request.value, "status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/preferences")
async def get_preferences():
    """Get all user preferences."""
    try:
        async with async_session() as session:
            prefs = await get_all_preferences(session)
            return {"preferences": prefs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# Conversation Endpoints
# ═══════════════════════════════════════════════════════════════

@app.get("/api/conversations")
async def list_conversations():
    """List all conversations, newest first."""
    try:
        async with async_session() as session:
            result = await session.execute(
                select(Conversation).order_by(Conversation.created_at.desc()).limit(50)
            )
            conversations = result.scalars().all()
            return {
                "conversations": [
                    {
                        "id": str(c.id),
                        "title": c.title,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                    }
                    for c in conversations
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get all messages for a conversation."""
    try:
        async with async_session() as session:
            messages = await get_conversation_messages(
                session, uuid.UUID(conversation_id)
            )
            return {
                "conversation_id": conversation_id,
                "messages": [
                    {
                        "id": str(m.id),
                        "role": m.role,
                        "content": m.content,
                        "metadata": m.metadata_,
                        "created_at": m.created_at.isoformat() if m.created_at else None,
                    }
                    for m in messages
                ],
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# TTS Endpoint
# ═══════════════════════════════════════════════════════════════

@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech. Returns audio bytes or null if no TTS provider."""
    try:
        audio_bytes = await synthesize(
            request.text,
            voice_id=request.voice_id or "pNInz6obpgDQGcFmaJgB",
        )

        if audio_bytes:
            return Response(
                content=audio_bytes,
                media_type="audio/mpeg",
                headers={"Content-Disposition": "inline; filename=speech.mp3"},
            )
        else:
            return {"audio": None, "fallback": "browser_speech_synthesis"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    """Health check — verifies database connectivity."""
    try:
        async with async_session() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "services": {
                "database": "connected",
                "llm": "configured" if settings.anthropic_api_key else "missing_key",
                "stt": "configured" if settings.openai_api_key else "missing_key",
                "tts": "configured" if settings.has_elevenlabs else "browser_fallback",
                "spotify": "configured" if settings.has_spotify else "not_configured",
                "youtube": "configured" if settings.has_youtube else "not_configured",
                "web_search": "configured" if settings.tavily_api_key else "missing_key",
            },
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# ═══════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════

async def _load_history(conversation_id: str) -> list:
    """Load conversation history as LangChain messages."""
    from langchain_core.messages import AIMessage, HumanMessage

    try:
        async with async_session() as session:
            messages = await get_conversation_messages(
                session, uuid.UUID(conversation_id), limit=20
            )

            history = []
            for msg in messages:
                if msg.role == "user":
                    history.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    history.append(AIMessage(content=msg.content))

            return history

    except Exception as e:
        logger.warning(f"Failed to load history: {e}")
        return []


# ── Startup / Shutdown Events ──

@app.on_event("startup")
async def startup():
    logger.info("🚀 Nova API starting up...")


@app.on_event("shutdown")
async def shutdown():
    logger.info("👋 Nova API shutting down...")
