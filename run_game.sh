#!/bin/bash

echo "Killing any process on port 3000..."
lsof -ti tcp:3000 | xargs kill -9 2>/dev/null || true

echo "Starting app-fe frontend..."
npm run dev -- -p 3000
