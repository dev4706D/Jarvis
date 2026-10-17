"""
Nova Tool: Web Scrape
Uses httpx + BeautifulSoup for lightweight scraping (Playwright fallback for JS-heavy pages).
"""

import logging
import re

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Tags to remove from scraped content
REMOVE_TAGS = [
    "script", "style", "nav", "footer", "header",
    "aside", "iframe", "noscript", "svg", "form",
]

MAX_CONTENT_LENGTH = 4000  # Chars — keep within LLM context budget


async def web_scrape(url: str) -> str:
    """
    Scrape a webpage and return its cleaned text content.

    Args:
        url: The URL to scrape.

    Returns:
        Cleaned text content from the page, truncated to ~4000 chars.
    """
    try:
        # First try with httpx (fast, no JS)
        content = await _scrape_with_httpx(url)

        if not content or len(content.strip()) < 100:
            # Fallback to Playwright for JS-rendered pages
            content = await _scrape_with_playwright(url)

        if not content:
            return f"Could not extract content from {url}"

        # Truncate with a clean boundary
        if len(content) > MAX_CONTENT_LENGTH:
            content = content[:MAX_CONTENT_LENGTH]
            last_period = content.rfind(".")
            if last_period > MAX_CONTENT_LENGTH * 0.8:
                content = content[: last_period + 1]
            content += "\n\n[Content truncated...]"

        return content

    except Exception as e:
        logger.error(f"Web scrape failed for {url}: {e}")
        return f"Failed to scrape {url}: {str(e)}"


async def _scrape_with_httpx(url: str) -> str:
    """Lightweight HTTP scrape — works for most static pages."""
    async with httpx.AsyncClient(
        timeout=15.0,
        follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (Nova AI Assistant)"},
    ) as client:
        response = await client.get(url)
        response.raise_for_status()
        return _extract_text(response.text)


async def _scrape_with_playwright(url: str) -> str:
    """Playwright scrape — handles JavaScript-rendered pages."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            # Wait a bit for JS to render
            await page.wait_for_timeout(2000)
            html = await page.content()
            await browser.close()
            return _extract_text(html)

    except Exception as e:
        logger.warning(f"Playwright scrape failed: {e}")
        return ""


def _extract_text(html: str) -> str:
    """Extract and clean text from HTML."""
    soup = BeautifulSoup(html, "html.parser")

    # Remove unwanted tags
    for tag in REMOVE_TAGS:
        for element in soup.find_all(tag):
            element.decompose()

    # Get text
    text = soup.get_text(separator="\n", strip=True)

    # Clean up whitespace
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    text = "\n".join(lines)

    # Remove excessive newlines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text
