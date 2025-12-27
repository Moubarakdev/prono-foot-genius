#!/bin/bash
# Script to pull Ollama model on first run

echo "🚀 Checking if Ollama model is available..."

# Wait for Ollama service to be ready
until curl -s http://ollama:11434/api/tags > /dev/null 2>&1; do
    echo "⏳ Waiting for Ollama service..."
    sleep 2
done

echo "✅ Ollama service is ready"

# Check if model exists
MODEL_NAME="${OLLAMA_MODEL:-llama3.2}"
if curl -s http://ollama:11434/api/tags | grep -q "\"name\":\"$MODEL_NAME\""; then
    echo "✅ Model $MODEL_NAME already exists"
else
    echo "📥 Pulling model $MODEL_NAME (this may take a few minutes)..."
    curl -X POST http://ollama:11434/api/pull -d "{\"name\":\"$MODEL_NAME\"}" 
    echo "✅ Model $MODEL_NAME downloaded"
fi
