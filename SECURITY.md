# Guide de sécurité ProxmoxDash

## 🔐 Configuration sécurisée

### 1. Variables d'environnement

ProxmoxDash utilise des fichiers de configuration pour gérer les secrets et paramètres sensibles :

- **Développement** : `config.env`
- **Production** : `config.prod.env`
- **Exemple** : `env.example`

### 2. Génération de tokens sécurisés

```bash
# Générer des tokens aléatoirement
node scripts/generate-tokens.js

# Ou manuellement avec OpenSSL
openssl rand -hex 32  # AUTH_TOKEN
openssl rand -base64 32  # JWT_SECRET
```

### 3. Configuration de production

#### Variables critiques à changer :

```env
# OBLIGATOIRE : Changez ces valeurs !
AUTH_TOKEN=your-super-secret-token-here
JWT_SECRET=your-jwt-secret-key-here

# SMTP sécurisé
SMTP_HOST=smtp.yourdomain.com
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=your-smtp-password
SMTP_TLS=true

# CORS restrictif
CORS_ORIGINS=https://yourdomain.com

# Limitation par IP (optionnel)
ALLOWED_IPS=192.168.1.100,10.0.0.50
```

## 🛡️ Niveaux de sécurité

### Authentification API

Le système utilise 3 niveaux d'accès :

1. **Public** : Health checks, informations de base
2. **Lecture optionnelle** : Alertes, SSE (avec ou sans auth)
3. **Administration** : CRUD apps, gestion alertes (auth requise)

### Routes protégées

```
🔓 Public (pas d'auth)
├── GET /api/health
└── GET /api/db/ping

🔒 Optionnel (auth recommandée)
├── GET /api/health/http
├── GET /api/health/tcp
├── GET /api/alerts
└── GET /api/alerts/stream

🔐 Protégé (auth obligatoire)
├── POST /api/apps
├── PUT /api/apps/{id}
├── DELETE /api/apps/{id}
├── POST /api/alerts
├── POST /api/alerts/{id}/ack
├── POST /api/notify/test
└── POST /api/notify/subscribe
```

## 🚀 Déploiement sécurisé

### 1. Docker Compose production

```yaml
version: "3.9"
services:
  api:
    build: ./backend
    env_file:
      - config.prod.env
    restart: unless-stopped
    
  web:
    build: ./frontend
    env_file:
      - config.prod.env
    restart: unless-stopped
    
  # Pas de MailHog en production
```

### 2. Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
```

### 3. Pare-feu

```bash
# UFW (Ubuntu)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect)
ufw allow 443/tcp   # HTTPS
ufw enable

# Bloquer l'accès direct aux ports de l'app
ufw deny 8080  # API
ufw deny 5173  # Frontend
```

## 🔍 Monitoring de sécurité

### 1. Logs à surveiller

```bash
# Tentatives d'authentification
grep "401\|403" /var/log/proxmoxdash/api.log

# Requêtes suspectes
grep "POST\|PUT\|DELETE" /var/log/proxmoxdash/api.log

# Erreurs de validation
grep "Invalid\|Error" /var/log/proxmoxdash/api.log
```

### 2. Alertes recommandées

- Échecs d'authentification répétés
- Requêtes depuis des IPs non autorisées
- Tentatives d'accès aux routes admin sans auth
- Volume anormal de requêtes

## 🔧 Maintenance sécurisée

### 1. Rotation des tokens

```bash
# Générer de nouveaux tokens
node scripts/generate-tokens.js

# Mettre à jour config.prod.env
# Redémarrer les services
docker compose restart
```

### 2. Mise à jour des dépendances

```bash
# Backend
cd backend && go mod tidy && go mod audit

# Frontend  
cd frontend && npm audit && npm update
```

### 3. Sauvegarde sécurisée

```bash
# Sauvegarder la base de données
cp data/app.db backups/app-$(date +%Y%m%d).db

# Chiffrer les sauvegardes
gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
    --s2k-digest-algo SHA512 --s2k-count 65536 --force-mdc \
    --symmetric backups/app-$(date +%Y%m%d).db
```

## ⚠️ Checklist de sécurité

### Avant la mise en production :

- [ ] Tokens par défaut changés
- [ ] HTTPS configuré avec certificats valides
- [ ] CORS configuré pour le domaine de production
- [ ] SMTP configuré avec authentification
- [ ] Pare-feu configuré
- [ ] Logs de sécurité activés
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring des erreurs en place
- [ ] Tests de pénétration basiques effectués

### Maintenance régulière :

- [ ] Rotation des tokens (tous les 3 mois)
- [ ] Mise à jour des dépendances (mensuel)
- [ ] Vérification des logs de sécurité (hebdomadaire)
- [ ] Test de restauration des sauvegardes (mensuel)
- [ ] Audit des accès utilisateurs (trimestriel)

## 🚨 En cas d'incident

1. **Isoler** : Couper l'accès réseau si nécessaire
2. **Analyser** : Examiner les logs pour comprendre l'incident
3. **Contenir** : Changer tous les tokens et mots de passe
4. **Restaurer** : Depuis une sauvegarde propre si nécessaire
5. **Améliorer** : Mettre en place des mesures préventives

## 📞 Contact sécurité

Pour signaler une vulnérabilité :
- Email : security@yourdomain.com
- Chiffrement PGP recommandé
- Délai de réponse : 48h maximum
