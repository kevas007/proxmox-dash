# .cursorrules — Proxmox/Docker Dashboard (Design + Notifications + Email)

> **But**: Définir les règles pour Cursor + l’équipe afin d’implémenter un dashboard **Go (API)** + **React (Vite/Tailwind)** + **SQLite** sous **Docker**, avec **design validé**, **apps en cards + logs**, et **notifications en temps réel + email SMTP**.

---

## 1) Portée & objectifs
- **Scope**: Multi‑noeuds Proxmox (Nodes, VMs, LXC), Docker, Apps (cards + logs intégrés), Databases, Storage, Network, Backups, Tasks & Logs, Settings.
- **Objectifs**:
  - UI moderne, claire, **dark/light**.
  - CRUD **Apps** (liens et santé), historisation locale des checks.
  - **Notifications**: temps réel (SSE) + **email SMTP** (dev via MailHog).
  - **SQLite** sans CGO, migrations automatiques.
  - **Docker Compose**: `api` (Go) + `web` (React) + `mailhog` (dev).

---

## 2) Design validé (à respecter)
- **Palette**: Teal (primaire), Amber (accent), gris Slate.
- **Composants maison**: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Badge`, `Button`, `Input`, `Select`, `Modal` (styles Tailwind sobres, arrondis `rounded-2xl`).
- **Layout**: Topbar collante (branding PD, cluster switch, bell), sidebar avec onglets, contenu en grille 12 colonnes.
- **Sections** (ordre):
  1. **Overview** – KPIs + graphes tendances (24h).
  2. **Nodes** – tableau/cartes (CPU/RAM/Disk, uptime, VMs/LXC/Docker).
  3. **VMs** – liste (vmid, node, état, CPU/MEM %, IP, actions safe).
  4. **LXC** – idem VMs.
  5. **Docker** – stacks/containers (state, health, CPU/MEM, image, ports).
  6. **Apps (cards + logs)** – CRUD + statut (HTTP/TCP via backend) + panneau **logs** par card.
  7. **Databases** – gestion entrées + **/api/db/ping** (latence, option liste DBs si dispo).
  8. **Storage** – pools/datastores (% usage, actions safe).
  9. **Network** – interfaces/bridges/VLANs.
  10. **Backups** – jobs (schedule, retention, last/next run) + actions mock.
  11. **Tasks & Logs** – tâches récentes, agreg.
  12. **Settings** – `VITE_API_URL`, Proxmox URL/Token, SMTP, sauvegarde locale.
- **Accessibilité**: contrastes AA, focus visible, libellés clairs, tailles 12–16px+.

---

## 3) Tech stack & conventions
- **Backend**: Go **1.22**; router **chi**; CORS; `modernc.org/sqlite` (no CGO); contexts partout; erreurs sans panic.
- **Frontend**: **React 18 + Vite + Tailwind**; icônes **lucide-react**; pas de CSS framework lourd; état local simple; fetch via helper `api()`.
- **Infra**: **Docker Compose** (api/web/mailhog), logs lisibles; healthchecks; `.editorconfig`; `.gitignore` propre.
- **Qualité**: `gofmt`, TS strict, PR petites; tests manuels endpoints clés avant merge.

---

## 4) Environnements & secrets
- **Backend (API)** – variables:
  - `PORT=8080`
  - `DB_PATH=/app/data/app.db`
  - `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
  - **SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_TLS=true|false`
  - **NOTIFY**: `NOTIFY_ENABLE_EMAIL=true|false`, `NOTIFY_ENABLE_SSE=true|false`, `NOTIFY_RATE_PER_MIN=60`
- **Frontend (Vite)**:
  - `VITE_API_URL=http://localhost:8080`
- **Dev mail**: MailHog UI `http://localhost:8025` ; SMTP `:1025`.

---

## 5) Base de données (SQLite)
### Tables existantes
- `apps(id, name, protocol, host, port, path, tag, icon, health_path, health_type, created_at)` — **déjà migrée**.

### Nouvelles tables (notifications)
```sql
-- migrations/002_notifications.sql
CREATE TABLE IF NOT EXISTS alerts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  source       TEXT NOT NULL,          -- ex: app:<id>, vm:<vmid>, node:<name>
  severity     TEXT NOT NULL,          -- info|warning|critical
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  payload      TEXT NULL,              -- JSON extra
  created_at   TEXT DEFAULT (datetime('now')),
  acknowledged INTEGER DEFAULT 0       -- 0/1
);

CREATE TABLE IF NOT EXISTS notify_subscriptions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  channel      TEXT NOT NULL,          -- email|webhook|sse
  endpoint     TEXT NOT NULL,          -- email addr / URL / ("sse" placeholder)
  enabled      INTEGER DEFAULT 1,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_queue (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  to_addr      TEXT NOT NULL,
  subject      TEXT NOT NULL,
  body_text    TEXT NOT NULL,
  state        TEXT DEFAULT 'queued',  -- queued|sent|error
  last_error   TEXT NULL,
  created_at   TEXT DEFAULT (datetime('now')),
  sent_at      TEXT NULL
);
```

---

## 6) API contrat (ajouts)
> Les routes existantes `/api/apps`, `/api/health/http`, `/api/health/tcp`, `/api/db/ping` sont conservées.

### Notifications — REST + SSE
- `GET  /api/alerts` → `[{id,source,severity,title,message,created_at,acknowledged}]` (tri desc)
- `POST /api/alerts` (admin) → créer une alerte manuelle (pour tests)
- `POST /api/alerts/{id}/ack` → ack l’alerte
- `GET  /api/alerts/stream` → **SSE** (Server‑Sent Events), events: `alert`, `ack`, `ping`
- `POST /api/notify/test` → déclenche un **email de test** (si SMTP configuré)
- `POST /api/notify/subscribe` `{channel:'email'|'webhook', endpoint:'...'}` → ajoute une subscription

### Émission d’alertes (sources)
- Health Apps: lors d’un changement d’état **online→offline** (ou latence>SLI), créer `alerts`.
- DB ping échec répété: `severity=warning`.
- (Plus tard) Proxmox/Docker: erreurs VM/LXC/containers.

### Email
- Worker interne (goroutine) balaie `email_queue.state='queued'` toutes les 2s, envoie via SMTP, met `sent_at` ou `last_error`.
- Modèle texte (UTF‑8), pas d’HTML pour commencer.

---

## 7) Docker Compose (ajouts notifications/email)
```yaml
version: "3.9"
services:
  api:
    build: ./backend
    environment:
      - PORT=8080
      - DB_PATH=/app/data/app.db
      - CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
      # SMTP (dev avec mailhog)
      - SMTP_HOST=mailhog
      - SMTP_PORT=1025
      - SMTP_USERNAME=
      - SMTP_PASSWORD=
      - SMTP_FROM="ProxmoxDash <noreply@example.local>"
      - SMTP_TLS=false
      - NOTIFY_ENABLE_EMAIL=true
      - NOTIFY_ENABLE_SSE=true
    depends_on:
      - mailhog
    volumes:
      - ./data:/app/data
    ports:
      - "8080:8080"

  web:
    build: ./frontend
    environment:
      - VITE_API_URL=http://api:8080
    command: ["npm","run","preview","--","--host","0.0.0.0","--port","80"]
    depends_on:
      - api
    ports:
      - "5173:80"

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "8025:8025"   # UI web
    # SMTP est exposé en interne sur 1025
```

---

## 8) Tâches à implémenter (backend Go)
1. **Migrations**: ajouter `002_notifications.sql` (voir §5) et exécuter au boot.
2. **SSE**: handler `GET /api/alerts/stream` (content-type `text/event-stream`, keepalive `:ping`).
3. **Store**: CRUD `alerts`, `notify_subscriptions`, `email_queue` (fonctions `ListAlerts`, `CreateAlert`, `AckAlert`, `AddSubscription`, `EnqueueEmail`).
4. **Worker email**: goroutine de fond (intervalle 2s), SMTP via `net/smtp` ou `github.com/jordan-wright/email` (facultatif).
5. **Webhook (optionnel)**: POST JSON `{title,message,severity,source}` à chaque nouvelle alerte si subscription `webhook` active.
6. **Health Apps**: dans le cycle de polling (déjà en place), détecter changement d’état et créer une alerte + enfilement email aux abonnés `email`.
7. **Endpoint test**: `POST /api/notify/test {to:"user@example.com"}` → enfile un mail « Test OK ».

---

## 9) Intégration Frontend (réel + non‑bloquant)
- **Bell / compteur**: récupérer `/api/alerts?limit=20` au mount; incrément en SSE.
- **Toasts**: à chaque event SSE `alert` → toast (non bloquant) + badge sur bell.
- **Panneau Alerts**: liste scrollable + bouton *Ack* (PUT/POST `/api/alerts/{id}/ack`).
- **Settings → Notifications**: formulaire subscribe (email / webhook), test email (POST `/api/notify/test`).

---

## 10) Sécurité & perfs
- Auth: (v2) Token statique côté API (`AUTH_TOKEN`) + header `Authorization: Bearer` ; CORS restrictif.
- Secrets par env (pas de secrets commit).
- Limite d’envoi mail: `NOTIFY_RATE_PER_MIN` (throttle global simple).
- SSE: 1 connexion par client, ping keepalive 20–30s.

---

## 11) Tests & critères d’acceptation
- **Email dev**: `docker compose up -d`; ouvrir MailHog `http://localhost:8025`; `POST /api/notify/test {to:"me@local"}` ⇒ mail visible en 3s.
- **SSE**: ouvrir 2 onglets; POST `/api/alerts` ⇒ l’alerte apparaît en temps réel dans les deux.
- **Health change**: forcer un app offline → nouvelle alerte `severity=warning` + notif SSE + mail en file puis *sent*.
- **Idempotence**: pas de spam: une alerte par transition; rétablissement envoie une *info* (option).

---

## 12) Roadmap rapide
- v1.1: Proxmox API (nodes/vms/lxc) lecture + intégration Docker Engine/Portainer.
- v1.2: RBAC simple (viewer/admin), préférences utilisateur (seuils), rétention alerts.
- v1.3: Webhook Slack/Discord/Teams.

---

## 13) Raccourcis équipe (Cursor)
- Toujours créer/éditer composants dans `frontend/src/components/ui/*` si factorisation (Card/Badge/Button...).
- Éviter les dépendances lourdes; priorité au *vanilla* Tailwind + lucide.
- Référencer ces consignes en PR: « conforme `.cursorrules` §X ».

---

### TL;DR
- **Design validé**: ✅ (sections, palette, UI primitives).
- **Notifications**: à coder selon ce document: SSE + email (SMTP/MailHog).
- **Docker Compose**: inclut `mailhog` pour tester les emails.
- **Critère “OK”**: `/api/notify/test` livre un mail dans MailHog; l’onglet reçoit l’alerte en SSE instantanément.

