#!/bin/sh
# Start the Flask backend in the background
cd /app
python3 app.py &

# Start the Next.js development server in the foreground
cd /frontend
npm run dev
