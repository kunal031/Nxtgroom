FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port (Northflank usually sets PORT env var)
ENV PORT=8000
EXPOSE $PORT

# Command to run the application
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
