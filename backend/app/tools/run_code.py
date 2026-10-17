"""
Nova Tool: Run Code
Executes code in an isolated Docker container with strict security constraints.

Security model:
  - --network=none (no internet access)
  - --cap-drop=ALL (no Linux capabilities)
  - --read-only (read-only filesystem, tmpfs at /tmp)
  - --user=1000:1000 (non-root execution)
  - --memory=256m (memory limit)
  - --cpus=0.5 (CPU limit)
  - 30-second timeout
  - Ephemeral container destroyed after execution
"""

import json
import logging
import time

import docker
from docker.errors import ContainerError, DockerException, ImageNotFound

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_docker_client: docker.DockerClient | None = None


def _get_docker() -> docker.DockerClient:
    global _docker_client
    if _docker_client is None:
        _docker_client = docker.from_env()
    return _docker_client


async def run_code(language: str, code: str) -> dict:
    """
    Execute code in a secure, isolated Docker sandbox.

    Args:
        language: Programming language ('python' supported in v1)
        code: The code to execute

    Returns:
        dict with keys: stdout, stderr, exit_code, duration_ms
    """
    if language.lower() not in ("python", "python3"):
        return {
            "stdout": "",
            "stderr": f"Language '{language}' is not supported yet. Supported: python",
            "exit_code": 1,
            "duration_ms": 0,
        }

    start_time = time.time()

    try:
        client = _get_docker()

        # Verify sandbox image exists
        try:
            client.images.get(settings.sandbox_image)
        except ImageNotFound:
            return {
                "stdout": "",
                "stderr": "Sandbox image not found. Run: docker-compose build sandbox",
                "exit_code": 1,
                "duration_ms": 0,
            }

        # Run the code in an ephemeral, fully isolated container
        container = client.containers.run(
            image=settings.sandbox_image,
            stdin_open=True,
            remove=True,
            detach=False,
            # ── Security constraints ──
            network_mode="none",           # No network access
            cap_drop=["ALL"],              # Drop all Linux capabilities
            read_only=True,                # Read-only root filesystem
            user="1000:1000",              # Non-root execution
            mem_limit=settings.sandbox_memory_limit,
            nano_cpus=int(settings.sandbox_cpu_limit * 1e9),
            # Provide a writable /tmp via tmpfs
            tmpfs={"/tmp": "size=64m,noexec"},
            # Security options
            security_opt=["no-new-privileges:true"],
            # Pass code via environment + stdin
            environment={"PYTHONDONTWRITEBYTECODE": "1"},
            command=[],
            # Timeout
            # Note: docker-py `timeout` on containers.run is the API timeout,
            # not the execution timeout. The run.py wrapper handles the execution timeout.
            stdin=code.encode("utf-8"),
        )

        duration_ms = int((time.time() - start_time) * 1000)

        # Parse the JSON output from run.py
        try:
            output = container.decode("utf-8") if isinstance(container, bytes) else str(container)
            result = json.loads(output)
            result["duration_ms"] = duration_ms
            return result
        except (json.JSONDecodeError, AttributeError):
            return {
                "stdout": output if isinstance(output, str) else str(container),
                "stderr": "",
                "exit_code": 0,
                "duration_ms": duration_ms,
            }

    except ContainerError as e:
        duration_ms = int((time.time() - start_time) * 1000)
        stderr = e.stderr.decode("utf-8") if e.stderr else str(e)
        return {
            "stdout": "",
            "stderr": stderr,
            "exit_code": e.exit_status,
            "duration_ms": duration_ms,
        }

    except DockerException as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Docker error during code execution: {e}")
        return {
            "stdout": "",
            "stderr": f"Docker error: {str(e)}",
            "exit_code": 1,
            "duration_ms": duration_ms,
        }

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Unexpected error during code execution: {e}")
        return {
            "stdout": "",
            "stderr": f"Execution error: {str(e)}",
            "exit_code": 1,
            "duration_ms": duration_ms,
        }
