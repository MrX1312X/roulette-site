#!/bin/bash
# Install dependencies
pip install -r backend/requirements.txt

# Initialize database
python -c "
from backend.database import db, User
from backend.app import app
with app.app_context():
    db.create_all()
"

echo "Setup complete"