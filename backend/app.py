services:
  - type: web
    name: roulette-site
    runtime: python
    buildCommand: |
      pip install -r requirements.txt
    startCommand: |
      gunicorn --bind :$PORT backend.app:app
    envVars:
      - key: PORT
        value: 10000
      - key: FLASK_ENV
        value: production
