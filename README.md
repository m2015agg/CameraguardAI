# CameraGuardAI

A full-stack Next.js app for real-time camera event monitoring using Supabase and MQTT.

## Features
- Connects to Supabase for settings storage
- Real-time MQTT event display
- Settings UI for MQTT config
- Test page for Supabase and MQTT connections
- Tailwind CSS for styling

## Setup
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd cameraguardai
   ```

2. **Make setup.sh executable and run it:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   This will:
   - Create and populate your .env file with Supabase keys
   - Start the Supabase local stack
   - Bring up the full stack (MQTT and CameraGuardAI)

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run locally:**
   ```bash
   npm run dev
   ```

5. **Docker:**
   ```bash
   docker-compose up --build
   ```

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `MQTT_WS_URL`
- `MQTT_TOPIC`

## Pages
- `/` — Home, real-time MQTT events
- `/settings` — Edit MQTT config
- `/test` — Test Supabase and MQTT connections

---
MIT License 