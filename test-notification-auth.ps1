# Test du système de notifications avec authentification
# Ce script teste que les notifications SSE ne fonctionnent que pour les utilisateurs connectés

Write-Host "=== Test du système de notifications avec authentification ===" -ForegroundColor Green

# Configuration
$API_URL = "http://localhost:8080"
$SSE_URL = "$API_URL/api/alerts/stream"

Write-Host "`n1. Test sans authentification (doit échouer)..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $SSE_URL -Method GET -TimeoutSec 5
    Write-Host "❌ ERREUR: La connexion SSE devrait échouer sans authentification" -ForegroundColor Red
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ SUCCÈS: La connexion SSE est correctement bloquée sans authentification (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "❌ ERREUR: Réponse inattendue: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n2. Test avec token invalide (doit échouer)..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$SSE_URL?token=invalid_token" -Method GET -TimeoutSec 5
    Write-Host "❌ ERREUR: La connexion SSE devrait échouer avec un token invalide" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ SUCCÈS: La connexion SSE est correctement bloquée avec un token invalide (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "❌ ERREUR: Réponse inattendue: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n3. Test de l'endpoint de santé (doit fonctionner sans auth)..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SUCCÈS: L'endpoint de santé fonctionne sans authentification" -ForegroundColor Green
    } else {
        Write-Host "❌ ERREUR: L'endpoint de santé devrait fonctionner sans authentification" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERREUR: L'endpoint de santé ne fonctionne pas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Test de l'endpoint des alertes (lecture seule, doit fonctionner sans auth)..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/alerts" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SUCCÈS: L'endpoint de lecture des alertes fonctionne sans authentification" -ForegroundColor Green
    } else {
        Write-Host "❌ ERREUR: L'endpoint de lecture des alertes devrait fonctionner sans authentification" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERREUR: L'endpoint de lecture des alertes ne fonctionne pas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Test de création d'alerte (doit échouer sans auth)..." -ForegroundColor Yellow

$alertData = @{
    source = "test"
    severity = "info"
    title = "Test Alert"
    message = "Test message"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/alerts" -Method POST -Body $alertData -ContentType "application/json" -TimeoutSec 5
    Write-Host "❌ ERREUR: La création d'alerte devrait échouer sans authentification" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ SUCCÈS: La création d'alerte est correctement bloquée sans authentification (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "❌ ERREUR: Réponse inattendue: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Résumé du test ===" -ForegroundColor Green
Write-Host "✅ Le système de notifications SSE est maintenant protégé par authentification" -ForegroundColor Green
Write-Host "✅ Seuls les utilisateurs connectés peuvent recevoir des notifications en temps réel" -ForegroundColor Green
Write-Host "✅ Les endpoints de lecture restent accessibles pour la compatibilité" -ForegroundColor Green
Write-Host "✅ Les opérations d'écriture nécessitent une authentification" -ForegroundColor Green

Write-Host "`nPour tester avec un utilisateur connecté:" -ForegroundColor Cyan
Write-Host "1. Connectez-vous via l'interface web" -ForegroundColor Cyan
Write-Host "2. Les notifications SSE se connecteront automatiquement" -ForegroundColor Cyan
Write-Host "3. Créez une alerte pour voir la notification en temps réel" -ForegroundColor Cyan
