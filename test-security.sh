#!/bin/bash

# Script de test de sécurité pour ProxmoxDash
# Usage: ./test-security.sh

API_URL="http://localhost:8080"
TOKEN="dev-token-change-in-production-12345"

echo "🔐 Test de sécurité ProxmoxDash"
echo "================================"

# Test 1: Route publique (doit fonctionner)
echo -e "\n1. Test route publique /api/health"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$API_URL/api/health"

# Test 2: Route protégée sans token (doit échouer - 401)
echo -e "\n2. Test route protégée sans token /api/apps"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$API_URL/api/apps"

# Test 3: Route protégée avec mauvais token (doit échouer - 401)
echo -e "\n3. Test route protégée avec mauvais token"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -H "Authorization: Bearer wrong-token" \
  "$API_URL/api/apps"

# Test 4: Route protégée avec bon token (doit fonctionner - 200)
echo -e "\n4. Test route protégée avec bon token"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/apps"

# Test 5: Test création d'app avec authentification
echo -e "\n5. Test création d'application"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "protocol": "http",
    "host": "localhost",
    "port": 3000,
    "path": "/",
    "health_path": "/health",
    "health_type": "http"
  }' \
  "$API_URL/api/apps"

# Test 6: Test des headers de sécurité
echo -e "\n6. Test des headers de sécurité"
echo "Headers de sécurité reçus:"
curl -s -I "$API_URL/api/health" | grep -E "(X-Content-Type-Options|X-Frame-Options|X-XSS-Protection|Content-Security-Policy)"

# Test 7: Test CORS
echo -e "\n7. Test CORS"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  "$API_URL/api/apps"

echo -e "\n✅ Tests de sécurité terminés"
echo -e "\nCodes de retour attendus:"
echo "- Routes publiques: 200"
echo "- Routes protégées sans auth: 401"
echo "- Routes protégées avec auth: 200"
echo "- CORS OPTIONS: 200"
