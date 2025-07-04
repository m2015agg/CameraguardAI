#!/bin/bash

# Activate virtual environment
source "$(dirname "$0")/venv/bin/activate"

# Run Lizi
python "$(dirname "$0")/lizi.py"

# Deactivate virtual environment when done
deactivate 