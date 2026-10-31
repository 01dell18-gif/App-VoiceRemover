FROM node:20-bookworm-slim

# Install system dependencies (Python 3, pip, ffmpeg, git, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    ffmpeg \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python Demucs AI dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Install Node.js dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose default port
EXPOSE 3032

# Production environment variables
ENV PORT=3032
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3032/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
