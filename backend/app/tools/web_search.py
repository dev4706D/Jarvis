"""
Nova Tool: Web Search
Uses Tavily API for real-time web search with AI-optimized results.
"""

import logging

from tavily import AsyncTavilyClient

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: AsyncTavilyClient | None = None


def _get_client() -> AsyncTavilyClient:
    global _client
    if _client is None:
        _client = AsyncTavilyClient(api_key=settings.tavily_api_key)
    return _client


async def web_search(query: str) -> str:
    """
    Search the web for current information using Tavily.

    Args:
        query: The search query string.

    Returns:
        Formatted search results with titles, snippets, and URLs.
    """
    try:
        client = _get_client()
        response = await client.search(
            query=query,
            search_depth="basic",
            max_results=5,
            include_answer=True,
        )

        parts = []

        # Include the AI-generated answer if available
        if response.get("answer"):
            parts.append(f"Summary: {response['answer']}\n")

        # Format individual results
        results = response.get("results", [])
        for i, result in enumerate(results, 1):
            title = result.get("title", "No title")
            snippet = result.get("content", "No snippet")[:300]
            url = result.get("url", "")
            parts.append(f"{i}. **{title}**\n   {snippet}\n   Source: {url}")

        if not parts:
            return "No search results found."

        return "\n\n".join(parts)

    except Exception as e:
        logger.error(f"Web search failed: {e}")
        return f"Search failed: {str(e)}"
