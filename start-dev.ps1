# Script de démarrage rapide pour ProxmoxDash
# Lance le backend et le frontend en parallèle

Write-Host "🚀 Démarrage de ProxmoxDash en mode développement" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Vérifier que les dépendances sont installées
if (!(Test-Path "backend/go.mod")) {
    Write-Host "❌ Backend Go non configuré" -ForegroundColor Red
    exit 1
}

if (!(Test-Path "frontend/node_modules")) {
    Write-Host "📦 Installation des dépendances frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

if (!(Test-Path "config.env")) {
    Write-Host "⚙️  Création du fichier de configuration..." -ForegroundColor Yellow
    Copy-Item "env.example" "config.env"
}

# Créer les répertoires nécessaires
@("data", "logs", "backups") | ForEach-Object {
    if (!(Test-Path $_)) {
        New-Item -ItemType Directory -Name $_ | Out-Null
        Write-Host "📁 Répertoire $_ créé" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "🔧 Démarrage des services..." -ForegroundColor Yellow

# Démarrer le backend en arrière-plan
Write-Host "🟢 Démarrage du backend Go sur http://localhost:8080" -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    go run ./cmd/main.go
}

# Attendre un peu que le backend démarre
Start-Sleep -Seconds 3

# Tester si le backend répond
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend démarré avec succès" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend en cours de démarrage..." -ForegroundColor Yellow
}

# Démarrer le frontend en arrière-plan
Write-Host "🟦 Démarrage du frontend React sur http://localhost:5173" -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    npm run dev
}

Write-Host ""
Write-Host "🎉 Services en cours de démarrage!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:8080" -ForegroundColor Green
Write-Host "📧 MailHog:  http://localhost:8025 (si Docker actif)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Commandes utiles:" -ForegroundColor White
Write-Host "  - Arrêter les services: Ctrl+C puis Get-Job | Stop-Job" -ForegroundColor Gray
Write-Host "  - Voir les logs backend: Receive-Job $($backendJob.Id)" -ForegroundColor Gray
Write-Host "  - Voir les logs frontend: Receive-Job $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""

# Attendre et afficher les logs
Write-Host "📊 Logs en temps réel (Ctrl+C pour arrêter):" -ForegroundColor White
Write-Host "=" * 50 -ForegroundColor Gray

try {
    while ($true) {
        # Afficher les logs du backend
        $backendLogs = Receive-Job $backendJob.Id
        if ($backendLogs) {
            $backendLogs | ForEach-Object { Write-Host "[BACKEND] $_" -ForegroundColor Green }
        }

        # Afficher les logs du frontend
        $frontendLogs = Receive-Job $frontendJob.Id
        if ($frontendLogs) {
            $frontendLogs | ForEach-Object { Write-Host "[FRONTEND] $_" -ForegroundColor Cyan }
        }

        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Arrêt des services..." -ForegroundColor Yellow
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    Write-Host "✅ Services arrêtés" -ForegroundColor Green
}
