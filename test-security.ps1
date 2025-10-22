# Script de test de sécurité pour ProxmoxDash (PowerShell)
# Usage: .\test-security.ps1

$API_URL = "http://localhost:8080"
$TOKEN = "dev-token-change-in-production-12345"

Write-Host "🔐 Test de sécurité ProxmoxDash" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Fonction pour tester une URL
function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$Description
    )

    Write-Host "`n$Description" -ForegroundColor Yellow

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
        }

        if ($Body) {
            $params.Body = $Body
        }

        $response = Invoke-WebRequest @params
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        return $response.StatusCode
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode) {
            Write-Host "Status: $statusCode" -ForegroundColor Red
            return $statusCode
        } else {
            Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
            return 0
        }
    }
}

# Test 1: Route publique (doit fonctionner - 200)
Test-ApiEndpoint -Url "$API_URL/api/health" -Description "1. Test route publique /api/health"

# Test 2: Route protégée sans token (doit échouer - 401)
Test-ApiEndpoint -Url "$API_URL/api/apps" -Description "2. Test route protégée sans token /api/apps"

# Test 3: Route protégée avec mauvais token (doit échouer - 401)
$badHeaders = @{
    "Authorization" = "Bearer wrong-token"
}
Test-ApiEndpoint -Url "$API_URL/api/apps" -Headers $badHeaders -Description "3. Test route protégée avec mauvais token"

# Test 4: Route protégée avec bon token (doit fonctionner - 200)
$goodHeaders = @{
    "Authorization" = "Bearer $TOKEN"
}
Test-ApiEndpoint -Url "$API_URL/api/apps" -Headers $goodHeaders -Description "4. Test route protégée avec bon token"

# Test 5: Test création d'app avec authentification
$createHeaders = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}
$appData = @{
    name = "Test App Security"
    protocol = "http"
    host = "localhost"
    port = 3000
    path = "/"
    health_path = "/health"
    health_type = "http"
} | ConvertTo-Json

Test-ApiEndpoint -Url "$API_URL/api/apps" -Method "POST" -Headers $createHeaders -Body $appData -Description "5. Test création d'application"

# Test 6: Test des headers de sécurité
Write-Host "`n6. Test des headers de sécurité" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/health" -UseBasicParsing
    Write-Host "Headers de sécurité reçus:" -ForegroundColor Cyan

    $securityHeaders = @(
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Content-Security-Policy",
        "Referrer-Policy"
    )

    foreach ($header in $securityHeaders) {
        if ($response.Headers[$header]) {
            Write-Host "  $header : $($response.Headers[$header])" -ForegroundColor Green
        } else {
            Write-Host "  $header : Non présent" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Erreur lors du test des headers: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Test CORS
$corsHeaders = @{
    "Origin" = "http://localhost:5173"
    "Access-Control-Request-Method" = "GET"
    "Access-Control-Request-Headers" = "Authorization"
}
Test-ApiEndpoint -Url "$API_URL/api/apps" -Method "OPTIONS" -Headers $corsHeaders -Description "7. Test CORS"

Write-Host "`n✅ Tests de sécurité terminés" -ForegroundColor Green
Write-Host "`nCodes de retour attendus:" -ForegroundColor Cyan
Write-Host "- Routes publiques: 200" -ForegroundColor White
Write-Host "- Routes protégées sans auth: 401" -ForegroundColor White
Write-Host "- Routes protégées avec auth: 200" -ForegroundColor White
Write-Host "- CORS OPTIONS: 200" -ForegroundColor White

Write-Host "`n📋 Pour démarrer le serveur de test:" -ForegroundColor Yellow
Write-Host "cd backend && go run ./cmd/main.go" -ForegroundColor White
