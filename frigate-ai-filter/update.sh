#!/bin/bash

# Pull the latest changes from the repository
git pull origin main

# Restart the Docker container
docker-compose down
docker-compose up -d

echo "Update completed. The application has been restarted." 