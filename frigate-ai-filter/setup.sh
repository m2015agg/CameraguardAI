#!/bin/bash

# Create the events.db file
touch events.db

# Set permissions for the events.db file
chmod 666 events.db

# Set permissions for the directory
chmod 777 .

echo "Setup completed. The events.db file has been created and permissions have been set."

# Create config directory if it doesn't exist
mkdir -p config

# Create mosquitto.conf
cat > config/mosquitto.conf << EOL
listener 1883
allow_anonymous true
password_file /mosquitto/config/passwd
EOL

# Create passwd file
cat > config/passwd << EOL
# Empty password file for anonymous access
EOL

# Create mqtt_config.json
cat > config/mqtt_config.json << EOL
{
  "host": "mqtt",
  "port": 1883,
  "username": "",
  "password": "",
  "topic": "frigate/events"
}
EOL

# Set permissions
chmod 644 config/*
chmod 755 config/ 