# Makefile principal pour le projet ProxmoxDash

.PHONY: help build test test-backend test-frontend test-integration clean install

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend
TESTS_DIR = tests

# Couleurs pour l'affichage
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Affiche cette aide
	@echo "$(GREEN)ProxmoxDash - Commandes disponibles:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Installe les dépendances
	@echo "$(GREEN)Installation des dépendances...$(NC)"
	@cd $(BACKEND_DIR) && go mod tidy
	@cd $(FRONTEND_DIR) && npm install

build: ## Build le projet
	@echo "$(GREEN)Build du projet...$(NC)"
	@cd $(BACKEND_DIR) && go build -o main cmd/main.go
	@cd $(FRONTEND_DIR) && npm run build

test: test-backend test-frontend ## Lance tous les tests
	@echo "$(GREEN)Tous les tests sont terminés$(NC)"

test-backend: ## Lance les tests du backend
	@echo "$(GREEN)Tests du backend...$(NC)"
	@cd $(BACKEND_DIR) && go test -v ./...

test-frontend: ## Lance les tests du frontend
	@echo "$(GREEN)Tests du frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run test:run

test-coverage: ## Lance les tests avec couverture
	@echo "$(GREEN)Tests avec couverture...$(NC)"
	@cd $(BACKEND_DIR) && go test -cover ./...
	@cd $(FRONTEND_DIR) && npm run test:coverage

test-watch: ## Lance les tests en mode watch
	@echo "$(GREEN)Tests en mode watch...$(NC)"
	@cd $(FRONTEND_DIR) && npm test

test-ui: ## Lance l'interface de test
	@echo "$(GREEN)Interface de test...$(NC)"
	@cd $(FRONTEND_DIR) && npm run test:ui

clean: ## Nettoie les fichiers de build
	@echo "$(GREEN)Nettoyage...$(NC)"
	@cd $(BACKEND_DIR) && go clean
	@cd $(FRONTEND_DIR) && rm -rf dist node_modules/.vite
	@rm -rf $(TESTS_DIR)/coverage

dev: ## Lance le mode développement
	@echo "$(GREEN)Mode développement...$(NC)"
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:5173"
	@echo "Utilisez Ctrl+C pour arrêter"

lint: ## Lance le linting
	@echo "$(GREEN)Linting...$(NC)"
	@cd $(BACKEND_DIR) && go vet ./...
	@cd $(FRONTEND_DIR) && npm run lint

format: ## Formate le code
	@echo "$(GREEN)Formatage du code...$(NC)"
	@cd $(BACKEND_DIR) && go fmt ./...
	@cd $(FRONTEND_DIR) && npm run lint -- --fix
