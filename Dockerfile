# Use Node.js 20 (LTS) slim base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install Python and set up virtual environment
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /app/venv

# Add Python venv to path
ENV PATH="/app/venv/bin:$PATH"

# Copy only Node package files for caching
COPY package*.json ./

# Install Node dependencies (including next)
RUN npm install

# Copy Python requirements and install
COPY src/lib/requirements.txt ./src/lib/
RUN pip install --no-cache-dir -r src/lib/requirements.txt

# Copy the entire project
COPY . .

# OPTIONAL: Print debug info if you need it
# RUN echo "=== Project Contents ===" && tree -L 2 src && cat src/components/ui/card.tsx

# Build Next.js app
RUN npm run build

# Ensure start script is executable
RUN chmod +x ./start.sh

# Expose Next.js default port
EXPOSE 3000

# Run custom startup (you can replace with `npm start` if not needed)
CMD ["./start.sh"]