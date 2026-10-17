# Nova Code Execution Sandbox
# Security: non-root, no network, read-only fs, resource-limited
FROM python:3.12-slim AS sandbox

# Remove package managers and network tools to reduce attack surface
RUN apt-get purge -y --auto-remove wget curl && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

# Create non-root user
RUN groupadd -g 1000 sandbox && \
    useradd -u 1000 -g sandbox -s /bin/false -M sandbox

# Create working directory with correct permissions
RUN mkdir -p /workspace /tmp && \
    chown sandbox:sandbox /workspace /tmp

WORKDIR /workspace

# Copy the execution wrapper script
COPY --chmod=755 run.py /usr/local/bin/run.py

USER sandbox

# Default entrypoint: read code from stdin and execute
ENTRYPOINT ["python", "/usr/local/bin/run.py"]
