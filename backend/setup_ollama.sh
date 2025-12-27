#!/bin/bash
# Script pour configurer Ollama avec le modèle optimal

echo "🚀 Configuration de Ollama..."

# Démarrer le service Ollama
echo "📦 Démarrage du service Ollama..."
docker-compose up -d ollama

# Attendre que le service soit prêt
echo "⏳ Attente du service Ollama..."
sleep 10

# Vérifier que Ollama est disponible
max_retries=30
retry=0
while [ $retry -lt $max_retries ]; do
    if docker exec api-football-ollama-1 curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama est prêt!"
        break
    fi
    retry=$((retry+1))
    echo "⏳ Tentative $retry/$max_retries..."
    sleep 2
done

if [ $retry -eq $max_retries ]; then
    echo "❌ Échec: Ollama ne répond pas"
    exit 1
fi

# Télécharger le modèle Mistral (7B - optimal pour paris sportifs)
echo "📥 Téléchargement du modèle Mistral (7B)..."
echo "⏳ Cela peut prendre 5-10 minutes selon votre connexion..."
docker exec api-football-ollama-1 ollama pull mistral

# Vérifier que le modèle est installé
echo "🔍 Vérification du modèle..."
docker exec api-football-ollama-1 ollama list

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📊 Modèle installé: Mistral (7B)"
echo "🎯 Optimisé pour: Analyse de paris sportifs"
echo "⚙️  Paramètres: temperature=0.3, top_p=0.85"
echo ""
echo "🔄 Redémarrage de l'API pour appliquer les changements..."
docker-compose restart api

echo ""
echo "✅ Tout est prêt! Vous pouvez maintenant utiliser l'analyse IA."
echo ""
echo "📝 Pour tester:"
echo "   1. Créez un nouveau coupon sur l'interface"
echo "   2. L'analyse IA devrait se faire avec Ollama (illimité)"
echo ""
echo "🔧 Modèles alternatifs:"
echo "   - llama3:8b   (plus précis, plus lent)"
echo "   - llama3.2    (plus rapide, moins précis)"
echo "   - codellama   (si vous voulez des analyses très structurées)"
echo ""
echo "Pour changer de modèle:"
echo "   1. docker exec api-football-ollama-1 ollama pull <model>"
echo "   2. Modifier OLLAMA_MODEL dans .env"
echo "   3. docker-compose restart api"
