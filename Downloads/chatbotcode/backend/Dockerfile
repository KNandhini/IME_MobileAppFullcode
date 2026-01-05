FROM python:3.13-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Taken from: https://hynek.me/articles/docker-uv/
# - Silence uv complaining about not being able to use hard links,
# - tell uv to byte-compile packages for faster application startups,
# - prevent uv from accidentally downloading isolated Python builds,
# - pick a Python (use `/usr/bin/python3.12` on uv 0.5.0 and later),
ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON=python3.13

# Set the working directory
WORKDIR /app

# Install dependencies first (better caching)
COPY pyproject.toml uv.lock .python-version ./
RUN uv sync

# Copy application code
COPY app/ ./app/
COPY assets/ ./assets/
COPY .env .env

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uv", "run", "fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
