"""
Nova STT (Speech-to-Text) — Whisper API integration.
Transcribes audio files using OpenAI's Whisper model.
Provider-agnostic interface for easy swapping to local Whisper later.
"""

import io
import logging

from openai import AsyncOpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def transcribe(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Transcribe audio to text using OpenAI Whisper API.

    Args:
        audio_bytes: Raw audio data (webm, mp3, wav, m4a supported)
        filename: Filename hint for format detection

    Returns:
        Transcribed text string
    """
    try:
        client = _get_client()

        # Create a file-like object from bytes
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename

        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text",
        )

        transcript = response.strip()
        logger.info(f"Transcribed audio: {transcript[:100]}...")
        return transcript

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise
