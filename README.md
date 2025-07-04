# CameraGuardAI – Setup & Local Development

## Prerequisites

- **Docker** and **Docker Compose** installed ([Install Docker](https://docs.docker.com/get-docker/))
- **Git** installed

## 1. Clone the Supabase Repository

Clone the official Supabase repository (for Docker files and configuration):

```sh
git clone --depth 1 https://github.com/supabase/supabase.git
```

## 2. Create Your Project Directory

Create a directory for your project (if you haven't already):

```sh
mkdir supabase-project
```

## 3. Copy Supabase Docker Files

Copy the Docker files from the Supabase repo into your project directory:

```sh
cp -rf supabase/docker/* supabase-project
```

## 4. Copy the Example Environment File

Copy the example `.env` file and edit it as needed:

```sh
cp supabase/docker/.env.example supabase-project/.env
```

Edit `supabase-project/.env` to set secure passwords and configuration.

## 5. Start the Supabase Stack

Navigate to your project directory and start the services:

```sh
cd supabase-project
docker compose pull
docker compose up -d
```

## 6. Check Service Status

Check that all services are running:

```sh
docker compose ps
```

All services should show `running (healthy)`.

## 7. Access Supabase Studio

Open [http://localhost:8000](http://localhost:8000) (or your server's IP:8000) in your browser.

- **Default credentials:**
  - Username: `supabase`
  - Password: `this_password_is_insecure_and_should_be_updated`

**Change these credentials in your `.env` file before using in production!**

---

## 8. Stopping and Restarting

To stop the stack:

```sh
docker compose down
```

To restart:

```sh
docker compose up -d
```

---

## 9. Updating

To update to the latest images:

```sh
docker compose pull
docker compose up -d
```

---

## References

- [Supabase Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)

---

**Note:**  
You do **not** need the Supabase CLI for self-hosting with Docker. All management can be done with Docker Compose.

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

### Editing .env Files in Linux Terminal
To edit your .env file directly in the terminal, you can use:
```bash
nano .env
```
or
```bash
vim .env
```
- **nano**: Simple editor, use Ctrl+O to save, Ctrl+X to exit.
- **vim**: Press `i` to enter insert mode, edit, then press `Esc`, type `:wq` to save and exit.

## Pages
- `/` — Home, real-time MQTT events
- `/settings` — Edit MQTT config
- `/test` — Test Supabase and MQTT connections

---
MIT License 