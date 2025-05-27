#!/bin/bash

# Create the events.db file
touch events.db

# Set permissions for the events.db file
chmod 666 events.db

# Set permissions for the directory
chmod 777 .

echo "Setup completed. The events.db file has been created and permissions have been set." 