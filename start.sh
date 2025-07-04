#!/bin/bash

# Start Lizi in the background
python3 /app/src/lib/lizi.py &

# Start the Node.js app
npm start 