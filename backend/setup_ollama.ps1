# Script PowerShell pour configurer Ollama avec le modèle optimal

Write-Host "🚀 Configuration de Ollama..." -ForegroundColor Cyan

# Démarrer le service Ollama
Write-Host "📦 Démarrage du service Ollama..." -ForegroundColor Yellow
docker-compose up -d ollama

# Attendre que le service soit prêt
Write-Host "⏳ Attente du service Ollama..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Vérifier que Ollama est disponible
$maxRetries = 30
$retry = 0
$isReady = $false

while ($retry -lt $maxRetries -and -not $isReady) {
    try {
        $result = docker exec api-football-ollama-1 curl -f http://localhost:11434/api/tags 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Ollama est prêt!" -ForegroundColor Green
            $isReady = $true
            break
        }
    } catch {
        # Continue retrying
    }
    $retry++
    Write-Host "⏳ Tentative $retry/$maxRetries..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if (-not $isReady) {
    Write-Host "❌ Échec: Ollama ne répond pas" -ForegroundColor Red
    exit 1
}

# Télécharger le modèle Mistral (7B - optimal pour paris sportifs)
Write-Host ""
Write-Host "📥 Téléchargement du modèle Mistral (7B)..." -ForegroundColor Cyan
Write-Host "⏳ Cela peut prendre 5-10 minutes selon votre connexion..." -ForegroundColor Yellow
docker exec api-football-ollama-1 ollama pull mistral

# Vérifier que le modèle est installé
Write-Host ""
Write-Host "🔍 Vérification du modèle..." -ForegroundColor Cyan
docker exec api-football-ollama-1 ollama list

Write-Host ""
Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Modèle installé: Mistral (7B)" -ForegroundColor Cyan
Write-Host "🎯 Optimisé pour: Analyse de paris sportifs" -ForegroundColor Cyan
Write-Host "⚙️  Paramètres: temperature=0.3, top_p=0.85" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 Redémarrage de l'API pour appliquer les changements..." -ForegroundColor Yellow
docker-compose restart api

Write-Host ""
Write-Host "✅ Tout est prêt! Vous pouvez maintenant utiliser l'analyse IA." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Pour tester:" -ForegroundColor Cyan
Write-Host "   1. Créez un nouveau coupon sur l'interface"
Write-Host "   2. L'analyse IA devrait se faire avec Ollama (illimité)"
Write-Host ""
Write-Host "🔧 Modèles alternatifs:" -ForegroundColor Cyan
Write-Host "   - llama3:8b   (plus précis, plus lent)"
Write-Host "   - llama3.2    (plus rapide, moins précis)"
Write-Host "   - codellama   (si vous voulez des analyses très structurées)"
Write-Host ""
Write-Host "Pour changer de modèle:" -ForegroundColor Yellow
Write-Host "   1. docker exec api-football-ollama-1 ollama pull <model>"
Write-Host "   2. Modifier OLLAMA_MODEL dans .env"
Write-Host "   3. docker-compose restart api"
