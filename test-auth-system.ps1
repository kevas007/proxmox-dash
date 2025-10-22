# Script de test pour le système d'authentification
# Teste les différents endpoints et fonctionnalités

$baseUrl = "http://localhost:8080"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "🔐 Test du système d'authentification ProxmoxDash" -ForegroundColor Cyan
Write-Host "=" * 50

# Test 1: Vérifier que le serveur répond
Write-Host "`n1️⃣  Test de santé du serveur..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
    Write-Host "✅ Serveur en ligne: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Serveur non accessible" -ForegroundColor Red
    Write-Host "   Assurez-vous que le backend est démarré avec: go run ./cmd/main.go" -ForegroundColor Yellow
    exit 1
}

# Test 2: Tentative de connexion avec un utilisateur invalide
Write-Host "`n2️⃣  Test de connexion avec des identifiants invalides..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "invalid"
        password = "invalid"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -Headers $headers
    Write-Host "❌ Erreur: Connexion réussie avec des identifiants invalides" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Connexion refusée comme attendu" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur inattendue: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Connexion avec l'utilisateur admin
Write-Host "`n3️⃣  Test de connexion avec l'utilisateur admin..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -Headers $headers
    $adminToken = $loginResponse.token
    $adminUser = $loginResponse.user

    Write-Host "✅ Connexion admin réussie" -ForegroundColor Green
    Write-Host "   Utilisateur: $($adminUser.username)" -ForegroundColor Cyan
    Write-Host "   Rôle: $($adminUser.role)" -ForegroundColor Cyan
    Write-Host "   Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erreur de connexion admin: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Accès aux informations utilisateur
Write-Host "`n4️⃣  Test d'accès aux informations utilisateur..." -ForegroundColor Yellow
try {
    $authHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    }

    $meResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET -Headers $authHeaders
    Write-Host "✅ Informations utilisateur récupérées" -ForegroundColor Green
    Write-Host "   ID: $($meResponse.id)" -ForegroundColor Cyan
    Write-Host "   Username: $($meResponse.username)" -ForegroundColor Cyan
    Write-Host "   Email: $($meResponse.email)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erreur d'accès aux informations: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Liste des utilisateurs (admin seulement)
Write-Host "`n5️⃣  Test de liste des utilisateurs (admin)..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/users" -Method GET -Headers $authHeaders
    Write-Host "✅ Liste des utilisateurs récupérée" -ForegroundColor Green
    Write-Host "   Nombre d'utilisateurs: $($usersResponse.Count)" -ForegroundColor Cyan

    foreach ($user in $usersResponse) {
        $status = if ($user.active) { "Actif" } else { "Inactif" }
        Write-Host "   - $($user.username) ($($user.role)) - $status" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erreur de récupération des utilisateurs: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Connexion avec l'utilisateur demo
Write-Host "`n6️⃣  Test de connexion avec l'utilisateur demo..." -ForegroundColor Yellow
try {
    $demoLoginData = @{
        username = "demo"
        password = "demo123"
    } | ConvertTo-Json

    $demoLoginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $demoLoginData -Headers $headers
    $demoToken = $demoLoginResponse.token
    $demoUser = $demoLoginResponse.user

    Write-Host "✅ Connexion demo réussie" -ForegroundColor Green
    Write-Host "   Utilisateur: $($demoUser.username)" -ForegroundColor Cyan
    Write-Host "   Rôle: $($demoUser.role)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erreur de connexion demo: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Tentative d'accès admin avec utilisateur demo
Write-Host "`n7️⃣  Test d'accès admin avec utilisateur demo (doit échouer)..." -ForegroundColor Yellow
try {
    $demoAuthHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $demoToken"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/users" -Method GET -Headers $demoAuthHeaders
    Write-Host "❌ Erreur: L'utilisateur demo a accès aux fonctions admin" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ Accès refusé comme attendu (403 Forbidden)" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur inattendue: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 8: Test des permissions et rôles
Write-Host "`n8️⃣  Test des permissions utilisateur..." -ForegroundColor Yellow
try {
    $permissionsResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/permissions" -Method GET -Headers $authHeaders
    Write-Host "✅ Permissions récupérées" -ForegroundColor Green
    Write-Host "   Rôle: $($permissionsResponse.role)" -ForegroundColor Cyan
    Write-Host "   Nombre de permissions: $($permissionsResponse.permissions.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erreur de récupération des permissions: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Déconnexion
Write-Host "`n9️⃣  Test de déconnexion..." -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/logout" -Method POST -Headers $authHeaders
    Write-Host "✅ Déconnexion réussie" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur de déconnexion: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Tentative d'accès après déconnexion
Write-Host "`n🔟 Test d'accès après déconnexion (doit échouer)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET -Headers $authHeaders
    Write-Host "❌ Erreur: Accès autorisé après déconnexion" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Accès refusé après déconnexion comme attendu" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur inattendue: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 50
Write-Host "🎉 Tests du système d'authentification terminés !" -ForegroundColor Cyan
Write-Host "`n📋 Résumé des comptes disponibles:" -ForegroundColor Yellow
Write-Host "   • admin / admin123 (Administrateur)" -ForegroundColor Green
Write-Host "   • demo / demo123 (Utilisateur)" -ForegroundColor Blue
Write-Host "   • viewer / viewer123 (Observateur)" -ForegroundColor Magenta
Write-Host "`n🌐 Interface web: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 API Backend: http://localhost:8080" -ForegroundColor Cyan
