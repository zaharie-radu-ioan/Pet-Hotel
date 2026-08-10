#!/bin/bash

# Acorda automat permisiuni de executie pentru viitor
chmod +x "$0"

echo "Pornim containerul de Docker pentru baza de date..."
docker-compose up -d

echo "Asteptam 2 secunde pentru a ne asigura ca baza de date e gata..."
sleep 2

echo "Pornim serverul de backend (FastAPI)..."
uvicorn app.main:app --reload
