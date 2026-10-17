"""
Nova Memory Manager — embeddings, storage, and RAG retrieval.
Uses OpenAI embeddings + pgvector for semantic similarity search.
"""

import logging
from typing import Any

from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── OpenAI client for embeddings ──
_openai_client: AsyncOpenAI | None = None


def _get_openai() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai_client


async def embed_text(text_input: str) -> list[float]:
    """Generate an embedding vector for the given text using OpenAI."""
    client = _get_openai()
    response = await client.embeddings.create(
        model=settings.embedding_model,
        input=text_input,
        dimensions=settings.embedding_dimensions,
    )
    return response.data[0].embedding


async def store_memory(
    session: AsyncSession,
    content: str,
    category: str = "general",
) -> str:
    """Embed and store a memory in the database. Returns the memory ID."""
    try:
        embedding = await embed_text(content)

        # Use raw SQL for pgvector insertion
        result = await session.execute(
            text("""
                INSERT INTO memories (content, category, embedding)
                VALUES (:content, :category, :embedding::vector)
                RETURNING id
            """),
            {
                "content": content,
                "category": category,
                "embedding": str(embedding),
            },
        )
        memory_id = result.scalar_one()
        await session.commit()
        logger.info(f"Stored memory {memory_id}: {content[:80]}...")
        return str(memory_id)

    except Exception as e:
        logger.error(f"Failed to store memory: {e}")
        raise


async def recall_memories(
    session: AsyncSession,
    query: str,
    top_k: int = 5,
    category: str | None = None,
) -> list[dict[str, Any]]:
    """Search for similar memories using cosine similarity via pgvector."""
    try:
        query_embedding = await embed_text(query)

        # Build query with optional category filter
        sql = """
            SELECT id, content, category, 
                   1 - (embedding <=> :embedding::vector) AS similarity
            FROM memories
            WHERE embedding IS NOT NULL
        """
        params: dict[str, Any] = {"embedding": str(query_embedding), "top_k": top_k}

        if category:
            sql += " AND category = :category"
            params["category"] = category

        sql += " ORDER BY embedding <=> :embedding::vector LIMIT :top_k"

        result = await session.execute(text(sql), params)
        rows = result.fetchall()

        return [
            {
                "id": str(row.id),
                "content": row.content,
                "category": row.category,
                "similarity": round(float(row.similarity), 4),
            }
            for row in rows
        ]

    except Exception as e:
        logger.error(f"Failed to recall memories: {e}")
        return []


async def get_context_for_query(
    session: AsyncSession,
    query: str,
    top_k: int = 5,
) -> str:
    """
    Retrieve relevant memories and user preferences to inject into LLM context.
    This is the main RAG function called before each LLM turn.
    """
    from app.database import get_all_preferences

    # Retrieve relevant memories
    memories = await recall_memories(session, query, top_k=top_k)

    # Retrieve user preferences
    preferences = await get_all_preferences(session)

    # Format context block
    parts = []

    if preferences:
        pref_lines = [f"  - {k}: {v}" for k, v in preferences.items()]
        parts.append("User Preferences:\n" + "\n".join(pref_lines))

    if memories:
        memory_lines = []
        for m in memories:
            if m["similarity"] > 0.3:  # Only include meaningfully similar memories
                memory_lines.append(
                    f"  - [{m['category']}] {m['content']} (relevance: {m['similarity']})"
                )
        if memory_lines:
            parts.append("Relevant Memories:\n" + "\n".join(memory_lines))

    return "\n\n".join(parts) if parts else ""


async def embed_and_store_message(
    session: AsyncSession,
    content: str,
    role: str,
) -> None:
    """
    Embed and store a user/assistant message for future retrieval.
    Called automatically after each conversation turn.
    """
    if len(content.strip()) < 10:
        return  # Skip very short messages

    try:
        # Prefix with role for better retrieval context
        text_to_embed = f"{role}: {content}"
        await store_memory(session, text_to_embed, category="general")
    except Exception as e:
        # Non-fatal — don't break the conversation if embedding fails
        logger.warning(f"Failed to embed message: {e}")
