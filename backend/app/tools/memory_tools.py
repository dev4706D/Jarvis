"""
Nova Tool: Memory (remember + recall)
Provides the LLM with tools to explicitly store and retrieve knowledge.
"""

import logging

from app.config import get_settings
from app.database import async_session
from app.memory import recall_memories, store_memory

logger = logging.getLogger(__name__)
settings = get_settings()


async def remember(fact: str, category: str = "general") -> str:
    """
    Store a fact, preference, or instruction for future reference.

    Args:
        fact: The information to remember.
        category: One of 'general', 'preference', 'fact', 'instruction'.

    Returns:
        Confirmation message.
    """
    valid_categories = {"general", "preference", "fact", "instruction"}
    if category not in valid_categories:
        category = "general"

    try:
        async with async_session() as session:
            memory_id = await store_memory(session, fact, category=category)
            return f"Remembered: '{fact}' (category: {category}, id: {memory_id})"

    except Exception as e:
        logger.error(f"Failed to remember: {e}")
        return f"Failed to store memory: {str(e)}"


async def recall(query: str, top_k: int = 5) -> str:
    """
    Search past memories, stored facts, and preferences relevant to the query.

    Args:
        query: What to search for in memory.
        top_k: Number of results to return (default: 5).

    Returns:
        Formatted list of relevant memories with similarity scores.
    """
    try:
        async with async_session() as session:
            memories = await recall_memories(session, query, top_k=top_k)

            if not memories:
                return "No relevant memories found."

            lines = ["Relevant memories:"]
            for i, m in enumerate(memories, 1):
                lines.append(
                    f"  {i}. [{m['category']}] {m['content']} "
                    f"(similarity: {m['similarity']})"
                )
            return "\n".join(lines)

    except Exception as e:
        logger.error(f"Failed to recall: {e}")
        return f"Failed to search memories: {str(e)}"
