#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Usar puerto 5173 o el que esté libre
PORT=5173

# Ver si ya está corriendo
if lsof -i :$PORT >/dev/null 2>&1; then
  open http://localhost:$PORT
  exit 0
fi

# Build si no existe dist
if [ ! -d "$DIR/dist" ]; then
  echo "Compilando app..."
  cd "$DIR"
  npx --yes vite build 2>/dev/null || {
    echo "Error: primero ejecutá ./run.sh para instalar dependencias"
    sleep 3
    exit 1
  }
fi

echo "Servidor iniciado en http://localhost:$PORT"
open http://localhost:$PORT

cd "$DIR/dist"
python3 -m http.server $PORT
