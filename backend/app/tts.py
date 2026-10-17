"""
Nova TTS (Text-to-Speech) — ElevenLabs API integration.
Falls back to returning None (frontend uses browser SpeechSynthesis).
"""

import io
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def synthesize(text: str, voice_id: str = "pNInz6obpgDQGcFmaJgB") -> bytes | None:
    """
    Convert text to speech audio using ElevenLabs API.

    Args:
        text: Text to synthesize
        voice_id: ElevenLabs voice ID (default: "Adam" — a natural male voice)

    Returns:
        Audio bytes (mp3) or None if ElevenLabs is not configured
    """
    if not settings.has_elevenlabs:
        logger.info("ElevenLabs not configured — frontend will use browser SpeechSynthesis")
        return None

    try:
        from elevenlabs import AsyncElevenLabs

        client = AsyncElevenLabs(api_key=settings.elevenlabs_api_key)

        # Generate audio
        audio_generator = await client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_turbo_v2_5",
            output_format="mp3_44100_128",
        )

        # Collect all audio chunks
        audio_buffer = io.BytesIO()
        async for chunk in audio_generator:
            audio_buffer.write(chunk)

        audio_bytes = audio_buffer.getvalue()
        logger.info(f"Synthesized {len(text)} chars → {len(audio_bytes)} bytes audio")
        return audio_bytes

    except Exception as e:
        logger.error(f"TTS synthesis failed: {e}")
        return None
