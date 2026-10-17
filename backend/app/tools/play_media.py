"""
Nova Tool: Play Media
Controls Spotify playback (via spotipy) and YouTube search (via YouTube Data API).
"""

import logging
import webbrowser

import spotipy
from spotipy.oauth2 import SpotifyOAuth

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Spotify Client ──
_spotify_client: spotipy.Spotify | None = None


def _get_spotify() -> spotipy.Spotify | None:
    """Get or create authenticated Spotify client."""
    global _spotify_client

    if not settings.has_spotify:
        return None

    if _spotify_client is None:
        auth_manager = SpotifyOAuth(
            client_id=settings.spotify_client_id,
            client_secret=settings.spotify_client_secret,
            redirect_uri=settings.spotify_redirect_uri,
            scope="user-modify-playback-state user-read-playback-state user-read-currently-playing",
            cache_path=".spotify_cache",
            open_browser=False,
        )
        _spotify_client = spotipy.Spotify(auth_manager=auth_manager)

    return _spotify_client


async def play_media(platform: str, query: str, action: str = "play") -> str:
    """
    Control media playback on Spotify or YouTube.

    Args:
        platform: 'spotify' or 'youtube'
        query: Search query, track name, or artist
        action: 'play', 'pause', 'search', 'next', 'previous'

    Returns:
        Status message describing what was done.
    """
    platform = platform.lower().strip()

    if platform == "spotify":
        return await _handle_spotify(query, action)
    elif platform == "youtube":
        return await _handle_youtube(query, action)
    else:
        return f"Unknown platform: {platform}. Supported: spotify, youtube"


async def _handle_spotify(query: str, action: str) -> str:
    """Handle Spotify playback control."""
    sp = _get_spotify()
    if sp is None:
        return "Spotify is not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env"

    try:
        if action == "pause":
            sp.pause_playback()
            return "Paused Spotify playback."

        elif action == "next":
            sp.next_track()
            return "Skipped to next track on Spotify."

        elif action == "previous":
            sp.previous_track()
            return "Went back to previous track on Spotify."

        elif action == "search":
            results = sp.search(q=query, type="track", limit=5)
            tracks = results.get("tracks", {}).get("items", [])
            if not tracks:
                return f"No Spotify results found for '{query}'"

            lines = [f"Spotify search results for '{query}':"]
            for i, track in enumerate(tracks, 1):
                artists = ", ".join(a["name"] for a in track["artists"])
                lines.append(f"  {i}. {track['name']} by {artists}")
            return "\n".join(lines)

        elif action == "play":
            # Search for the track
            results = sp.search(q=query, type="track", limit=1)
            tracks = results.get("tracks", {}).get("items", [])

            if not tracks:
                return f"No Spotify results found for '{query}'"

            track = tracks[0]
            track_uri = track["uri"]
            track_name = track["name"]
            artists = ", ".join(a["name"] for a in track["artists"])

            # Get active device
            devices = sp.devices()
            active_devices = devices.get("devices", [])

            if not active_devices:
                return (
                    f"Found '{track_name}' by {artists}, but no active Spotify device. "
                    "Please open Spotify on a device first."
                )

            # Play on the first active device
            device_id = active_devices[0]["id"]
            sp.start_playback(device_id=device_id, uris=[track_uri])
            return f"Now playing '{track_name}' by {artists} on Spotify."

        else:
            return f"Unknown action: {action}. Supported: play, pause, search, next, previous"

    except spotipy.SpotifyException as e:
        error_msg = str(e)
        if "PREMIUM_REQUIRED" in error_msg.upper() or "403" in error_msg:
            return "Spotify Premium is required for playback control."
        logger.error(f"Spotify error: {e}")
        return f"Spotify error: {error_msg}"
    except Exception as e:
        logger.error(f"Spotify error: {e}")
        return f"Spotify error: {str(e)}"


async def _handle_youtube(query: str, action: str) -> str:
    """Handle YouTube search and open in browser."""
    if not settings.has_youtube:
        # Fallback: construct search URL directly
        search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
        webbrowser.open(search_url)
        return f"Opened YouTube search for '{query}' in your browser."

    try:
        from googleapiclient.discovery import build

        youtube = build("youtube", "v3", developerKey=settings.youtube_api_key)
        request = youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=5,
        )
        response = request.execute()
        items = response.get("items", [])

        if not items:
            return f"No YouTube results found for '{query}'"

        if action == "play":
            # Open the first result in browser
            video_id = items[0]["id"]["videoId"]
            video_title = items[0]["snippet"]["title"]
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            webbrowser.open(video_url)
            return f"Opening '{video_title}' on YouTube in your browser: {video_url}"

        elif action == "search":
            lines = [f"YouTube search results for '{query}':"]
            for i, item in enumerate(items, 1):
                title = item["snippet"]["title"]
                video_id = item["id"]["videoId"]
                url = f"https://www.youtube.com/watch?v={video_id}"
                lines.append(f"  {i}. {title}\n     {url}")
            return "\n".join(lines)

        else:
            return f"YouTube only supports 'play' and 'search' actions."

    except Exception as e:
        logger.error(f"YouTube error: {e}")
        return f"YouTube error: {str(e)}"
