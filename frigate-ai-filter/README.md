# Frigate AI Filter

This project is a Python application that runs in a Docker container. It subscribes to MQTT events, stores them in a SQLite database, and provides a Flask web server to view the events.

## Prerequisites

- Docker
- Docker Compose

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/m2015agg/CameraguardAI.git
   cd CameraguardAI/frigate-ai-filter
   ```

2. **Run the Setup Script**:
   Make the setup script executable and run it to create the necessary files and set permissions:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Build and Run the Docker Container**:
   Use Docker Compose to build and run the application:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Access the Application**:
   - View events at `http://<your-server-ip>:8080/events`
   - Configure MQTT settings at `http://<your-server-ip>:8080/settings`

## Configuration

- MQTT settings can be configured in the `config/mqtt_config.json` file or through the web interface at `/settings`.

## Troubleshooting

- If you encounter permission issues, ensure the `events.db` file and its directory have the correct permissions.
- Check Docker logs for any errors:
  ```bash
  docker-compose logs app
  ```

## License

This project is licensed under the MIT License. 