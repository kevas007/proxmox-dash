# Makefile pour ProxmoxDash
.PHONY: help build run test clean dev prod security-test

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend
DOCKER_COMPOSE = docker compose

# Couleurs pour l'affichage
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Affiche cette aide
	@echo "$(GREEN)ProxmoxDash - Commandes disponibles:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Installe toutes les dépendances
	@echo "$(GREEN)Installation des dépendances...$(NC)"
	cd $(BACKEND_DIR) && go mod download
	cd $(FRONTEND_DIR) && npm install

build: ## Compile le projet complet
	@echo "$(GREEN)Compilation du projet...$(NC)"
	cd $(BACKEND_DIR) && go build -o main ./cmd/main.go
	cd $(FRONTEND_DIR) && npm run build

run-backend: ## Lance le backend Go
	@echo "$(GREEN)Démarrage du backend...$(NC)"
	cd $(BACKEND_DIR) && go run ./cmd/main.go

run-frontend: ## Lance le frontend en mode dev
	@echo "$(GREEN)Démarrage du frontend...$(NC)"
	cd $(FRONTEND_DIR) && npm run dev

dev: ## Lance l'environnement de développement complet
	@echo "$(GREEN)Démarrage de l'environnement de développement...$(NC)"
	$(DOCKER_COMPOSE) --env-file config.env up -d

prod: ## Lance l'environnement de production
	@echo "$(GREEN)Démarrage de l'environnement de production...$(NC)"
	$(DOCKER_COMPOSE) --env-file config.prod.env up -d

stop: ## Arrête tous les services Docker
	@echo "$(YELLOW)Arrêt des services...$(NC)"
	$(DOCKER_COMPOSE) down

logs: ## Affiche les logs des services
	$(DOCKER_COMPOSE) logs -f

test: ## Lance les tests
	@echo "$(GREEN)Exécution des tests...$(NC)"
	cd $(BACKEND_DIR) && go test ./...
	cd $(FRONTEND_DIR) && npm test

security-test: ## Lance les tests de sécurité
	@echo "$(GREEN)Tests de sécurité...$(NC)"
	@if command -v curl >/dev/null 2>&1; then \
		bash test-security.sh; \
	else \
		powershell -ExecutionPolicy Bypass -File test-security.ps1; \
	fi

generate-tokens: ## Génère des tokens de sécurité
	@echo "$(GREEN)Génération de tokens sécurisés...$(NC)"
	node scripts/generate-tokens.js

clean: ## Nettoie les fichiers de build
	@echo "$(YELLOW)Nettoyage...$(NC)"
	cd $(BACKEND_DIR) && rm -f main main.exe
	cd $(FRONTEND_DIR) && rm -rf dist node_modules/.cache
	$(DOCKER_COMPOSE) down --volumes --remove-orphans

rebuild: clean build ## Nettoie et recompile tout

docker-build: ## Construit les images Docker
	@echo "$(GREEN)Construction des images Docker...$(NC)"
	$(DOCKER_COMPOSE) build

docker-rebuild: ## Reconstruit les images Docker sans cache
	@echo "$(GREEN)Reconstruction des images Docker...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache

health-check: ## Vérifie la santé des services
	@echo "$(GREEN)Vérification de la santé des services...$(NC)"
	@curl -f http://localhost:8080/api/health || echo "$(RED)Backend non disponible$(NC)"
	@curl -f http://localhost:5173/health || echo "$(RED)Frontend non disponible$(NC)"
	@curl -f http://localhost:8025/ || echo "$(RED)MailHog non disponible$(NC)"

backup: ## Sauvegarde la base de données
	@echo "$(GREEN)Sauvegarde de la base de données...$(NC)"
	@mkdir -p backups
	@cp data/app.db backups/app-$(shell date +%Y%m%d-%H%M%S).db
	@echo "$(GREEN)Sauvegarde créée dans backups/$(NC)"

restore: ## Restaure la dernière sauvegarde
	@echo "$(YELLOW)Restauration de la dernière sauvegarde...$(NC)"
	@latest=$$(ls -t backups/app-*.db 2>/dev/null | head -n1); \
	if [ -n "$$latest" ]; then \
		cp "$$latest" data/app.db; \
		echo "$(GREEN)Base de données restaurée depuis $$latest$(NC)"; \
	else \
		echo "$(RED)Aucune sauvegarde trouvée$(NC)"; \
	fi

setup-dev: ## Configuration initiale pour le développement
	@echo "$(GREEN)Configuration de l'environnement de développement...$(NC)"
	@if [ ! -f config.env ]; then \
		cp env.example config.env; \
		echo "$(GREEN)Fichier config.env créé$(NC)"; \
	fi
	@mkdir -p data backups logs
	$(MAKE) install
	@echo "$(GREEN)Environnement de développement prêt!$(NC)"
	@echo "$(YELLOW)Lancez 'make dev' pour démarrer$(NC)"

setup-prod: ## Configuration initiale pour la production
	@echo "$(GREEN)Configuration de l'environnement de production...$(NC)"
	@if [ ! -f config.prod.env ]; then \
		cp env.example config.prod.env; \
		echo "$(YELLOW)⚠️  Modifiez config.prod.env avec vos valeurs de production!$(NC)"; \
		echo "$(YELLOW)⚠️  Utilisez 'make generate-tokens' pour créer des tokens sécurisés$(NC)"; \
	fi
	@mkdir -p data backups logs
	@echo "$(GREEN)Configuration de production créée$(NC)"

lint: ## Lance les linters
	@echo "$(GREEN)Linting du code...$(NC)"
	cd $(BACKEND_DIR) && go fmt ./...
	cd $(FRONTEND_DIR) && npm run lint

format: ## Formate le code
	@echo "$(GREEN)Formatage du code...$(NC)"
	cd $(BACKEND_DIR) && go fmt ./...
	cd $(FRONTEND_DIR) && npm run lint --fix

update: ## Met à jour les dépendances
	@echo "$(GREEN)Mise à jour des dépendances...$(NC)"
	cd $(BACKEND_DIR) && go mod tidy && go get -u ./...
	cd $(FRONTEND_DIR) && npm update

# Commande par défaut
.DEFAULT_GOAL := help
