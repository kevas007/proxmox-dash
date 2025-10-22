# Guide de résolution des problèmes - ProxmoxDash

## 🚨 Problèmes courants et solutions

### 1. Erreurs CORS dans la console

#### Symptômes
```
Access to fetch at 'http://localhost:8080/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

#### Solutions
1. **Vérifier que le backend est démarré**
   ```bash
   curl http://localhost:8080/api/health
   ```

2. **Vérifier la configuration CORS dans config.env**
   ```env
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

3. **Redémarrer le backend après modification**
   ```bash
   cd backend && go run ./cmd/main.go
   ```

### 2. Erreurs TypeScript "Cannot read properties of null"

#### Symptômes
```
Uncaught TypeError: Cannot read properties of null (reading 'filter')
```

#### Solutions
1. **Ajouter des vérifications null dans le code**
   ```typescript
   // Au lieu de
   items.filter(...)
   
   // Utiliser
   items?.filter(...) || []
   ```

2. **Initialiser les états avec des valeurs par défaut**
   ```typescript
   const [items, setItems] = useState<Item[]>([]);
   ```

### 3. Erreurs de compilation TypeScript

#### Symptômes
```
Property 'X' does not exist on type 'Y'
```

#### Solutions
1. **Vérifier les imports**
   ```typescript
   import { useState, useEffect } from 'react';
   // Pas: import React, { useState, useEffect } from 'react';
   ```

2. **Vérifier les types dans utils/api.ts**
   ```typescript
   export interface App {
     // Tous les champs doivent être définis
   }
   ```

### 4. Backend ne démarre pas

#### Symptômes
```
go: cannot find main module
```

#### Solutions
1. **Vérifier le répertoire courant**
   ```bash
   cd backend
   go mod tidy
   go run ./cmd/main.go
   ```

2. **Vérifier les dépendances Go**
   ```bash
   go mod download
   ```

### 5. Frontend ne compile pas

#### Symptômes
```
Module not found: Can't resolve '@/...'
```

#### Solutions
1. **Vérifier la configuration Vite**
   ```typescript
   // vite.config.ts
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     },
   }
   ```

2. **Réinstaller les dépendances**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### 6. Base de données SQLite corrompue

#### Symptômes
```
database is locked
```

#### Solutions
1. **Arrêter tous les processus**
   ```bash
   pkill -f "go run"
   ```

2. **Supprimer et recréer la DB**
   ```bash
   rm data/app.db*
   # Redémarrer le backend pour recréer la DB
   ```

### 7. Ports déjà utilisés

#### Symptômes
```
bind: address already in use
```

#### Solutions
1. **Trouver et tuer le processus**
   ```bash
   # Windows
   netstat -ano | findstr :8080
   taskkill /PID <PID> /F
   
   # Linux/macOS
   lsof -ti:8080 | xargs kill -9
   ```

2. **Changer le port dans config.env**
   ```env
   PORT=8081
   VITE_API_URL=http://localhost:8081
   ```

### 8. Docker Compose ne démarre pas

#### Symptômes
```
docker: command not found
```

#### Solutions
1. **Installer Docker Desktop**
   - Windows: https://docs.docker.com/desktop/windows/install/
   - macOS: https://docs.docker.com/desktop/mac/install/

2. **Utiliser le mode développement sans Docker**
   ```bash
   .\start-dev.ps1  # Windows
   ./start-dev.sh   # Linux/macOS
   ```

### 9. Erreurs d'authentification

#### Symptômes
```
401 Unauthorized
```

#### Solutions
1. **Utiliser le token de développement**
   ```
   Token: dev-token-change-in-production-12345
   ```

2. **Vérifier la configuration AUTH_TOKEN**
   ```env
   AUTH_TOKEN=dev-token-change-in-production-12345
   ```

### 10. MailHog ne fonctionne pas

#### Symptômes
```
Connection refused to localhost:8025
```

#### Solutions
1. **Démarrer avec Docker Compose**
   ```bash
   docker compose up -d mailhog
   ```

2. **Vérifier la configuration SMTP**
   ```env
   SMTP_HOST=mailhog  # Pour Docker
   SMTP_HOST=localhost  # Pour développement local
   ```

## 🛠️ Commandes de diagnostic

### Vérifier l'état des services
```bash
# Backend
curl http://localhost:8080/api/health

# Frontend
curl http://localhost:5173/

# MailHog
curl http://localhost:8025/
```

### Logs de débogage
```bash
# Backend Go
cd backend && go run ./cmd/main.go

# Frontend React
cd frontend && npm run dev

# Docker services
docker compose logs -f
```

### Tests de sécurité
```bash
# Windows
.\test-security.ps1

# Linux/macOS
./test-security.sh
```

## 📞 Support

### Informations à fournir en cas de problème
1. **Système d'exploitation** (Windows/macOS/Linux)
2. **Version de Node.js** (`node --version`)
3. **Version de Go** (`go version`)
4. **Messages d'erreur complets**
5. **Étapes pour reproduire le problème**

### Commandes de diagnostic
```bash
# Informations système
node --version
go version
docker --version

# État des ports
netstat -an | grep -E "(8080|5173|8025)"

# Processus en cours
ps aux | grep -E "(go|node|docker)"
```

### Reset complet
```bash
# Arrêter tous les services
docker compose down
pkill -f "go run"
pkill -f "npm run dev"

# Nettoyer les fichiers temporaires
rm -rf frontend/node_modules frontend/dist
rm -rf backend/main backend/main.exe
rm -rf data/*.db*

# Réinstaller et redémarrer
.\make.ps1 setup-dev  # Windows
make setup-dev        # Linux/macOS
```

## ✅ Checklist de vérification

Avant de signaler un problème, vérifiez :

- [ ] Le backend répond sur http://localhost:8080/api/health
- [ ] Le frontend est accessible sur http://localhost:5173
- [ ] Le fichier config.env existe et est configuré
- [ ] Les dépendances sont installées (go mod download, npm install)
- [ ] Aucun autre service n'utilise les ports 8080, 5173, 8025
- [ ] Les logs ne montrent pas d'erreurs évidentes
- [ ] La dernière version du code est utilisée (git pull)

Si le problème persiste après ces vérifications, consultez la documentation complète ou ouvrez une issue avec les informations de diagnostic.
