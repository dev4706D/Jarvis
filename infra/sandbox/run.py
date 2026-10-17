#!/usr/bin/env python3
"""
Sandbox code execution wrapper.
Reads code from stdin, executes it with a timeout, and prints JSON result.
"""

import json
import signal
import sys
import traceback
from io import StringIO

TIMEOUT_SECONDS = 30


def timeout_handler(signum, frame):
    raise TimeoutError(f"Execution timed out after {TIMEOUT_SECONDS} seconds")


def main():
    code = sys.stdin.read()

    if not code.strip():
        print(json.dumps({"stdout": "", "stderr": "No code provided", "exit_code": 1}))
        return

    stdout_capture = StringIO()
    stderr_capture = StringIO()

    old_stdout = sys.stdout
    old_stderr = sys.stderr

    try:
        # Set timeout
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(TIMEOUT_SECONDS)

        # Redirect stdout/stderr
        sys.stdout = stdout_capture
        sys.stderr = stderr_capture

        # Execute the code in a restricted namespace
        exec_globals = {"__builtins__": __builtins__}
        exec(code, exec_globals)

        # Cancel the alarm
        signal.alarm(0)

        exit_code = 0

    except TimeoutError as e:
        stderr_capture.write(str(e))
        exit_code = 124  # Standard timeout exit code

    except Exception:
        stderr_capture.write(traceback.format_exc())
        exit_code = 1

    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        signal.alarm(0)

    result = {
        "stdout": stdout_capture.getvalue(),
        "stderr": stderr_capture.getvalue(),
        "exit_code": exit_code,
    }

    print(json.dumps(result))


if __name__ == "__main__":
    main()
