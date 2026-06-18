#!/usr/bin/env bash
set -e

if ! command -v node &>/dev/null; then
  echo "Node.js no está instalado. Instalalo desde https://nodejs.org"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Instalando dependencias..."
  npm install
fi

echo "Iniciando RutaTrac..."
npm run dev
