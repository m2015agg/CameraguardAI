FROM node:20-slim

WORKDIR /app

# Install python and create a venv
RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  python3-venv \
  && rm -rf /var/lib/apt/lists/* \
  && python3 -m venv /app/venv

ENV PATH="/app/venv/bin:$PATH"

# Copy and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy Python requirements and install
COPY src/lib/requirements.txt ./src/lib/
RUN pip install --no-cache-dir -r src/lib/requirements.txt

# Copy app source after deps are installed (better caching)
COPY . .

# Build Next.js app
RUN npm run build

# Optional: make start script executable
RUN chmod +x ./start.sh

EXPOSE 3000

CMD ["./start.sh"]