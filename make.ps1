# Script PowerShell pour remplacer make sur Windows
# Usage: .\make.ps1 <commande>

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Variables
$BACKEND_DIR = "backend"
$FRONTEND_DIR = "frontend"
$DOCKER_COMPOSE = "docker compose"

# Couleurs
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Show-Help {
    Write-ColorText "ProxmoxDash - Commandes disponibles:" $Cyan
    Write-Host ""
    Write-ColorText "  help                 " $Yellow -NoNewline; Write-Host "Affiche cette aide"
    Write-ColorText "  install              " $Yellow -NoNewline; Write-Host "Installe toutes les dépendances"
    Write-ColorText "  build                " $Yellow -NoNewline; Write-Host "Compile le projet complet"
    Write-ColorText "  run-backend          " $Yellow -NoNewline; Write-Host "Lance le backend Go"
    Write-ColorText "  run-frontend         " $Yellow -NoNewline; Write-Host "Lance le frontend en mode dev"
    Write-ColorText "  dev                  " $Yellow -NoNewline; Write-Host "Lance l'environnement de développement complet"
    Write-ColorText "  prod                 " $Yellow -NoNewline; Write-Host "Lance l'environnement de production"
    Write-ColorText "  stop                 " $Yellow -NoNewline; Write-Host "Arrête tous les services Docker"
    Write-ColorText "  logs                 " $Yellow -NoNewline; Write-Host "Affiche les logs des services"
    Write-ColorText "  test                 " $Yellow -NoNewline; Write-Host "Lance les tests"
    Write-ColorText "  security-test        " $Yellow -NoNewline; Write-Host "Lance les tests de sécurité"
    Write-ColorText "  generate-tokens      " $Yellow -NoNewline; Write-Host "Génère des tokens de sécurité"
    Write-ColorText "  clean                " $Yellow -NoNewline; Write-Host "Nettoie les fichiers de build"
    Write-ColorText "  rebuild              " $Yellow -NoNewline; Write-Host "Nettoie et recompile tout"
    Write-ColorText "  docker-build         " $Yellow -NoNewline; Write-Host "Construit les images Docker"
    Write-ColorText "  docker-rebuild       " $Yellow -NoNewline; Write-Host "Reconstruit les images Docker sans cache"
    Write-ColorText "  health-check         " $Yellow -NoNewline; Write-Host "Vérifie la santé des services"
    Write-ColorText "  backup               " $Yellow -NoNewline; Write-Host "Sauvegarde la base de données"
    Write-ColorText "  restore              " $Yellow -NoNewline; Write-Host "Restaure la dernière sauvegarde"
    Write-ColorText "  setup-dev            " $Yellow -NoNewline; Write-Host "Configuration initiale pour le développement"
    Write-ColorText "  setup-prod           " $Yellow -NoNewline; Write-Host "Configuration initiale pour la production"
    Write-ColorText "  lint                 " $Yellow -NoNewline; Write-Host "Lance les linters"
    Write-ColorText "  format               " $Yellow -NoNewline; Write-Host "Formate le code"
    Write-ColorText "  update               " $Yellow -NoNewline; Write-Host "Met à jour les dépendances"
}

function Install-Dependencies {
    Write-ColorText "Installation des dépendances..." $Green
    Set-Location $BACKEND_DIR
    go mod download
    Set-Location ..
    Set-Location $FRONTEND_DIR
    npm install
    Set-Location ..
}

function Build-Project {
    Write-ColorText "Compilation du projet..." $Green
    Set-Location $BACKEND_DIR
    go build -o main.exe ./cmd/main.go
    Set-Location ..
    Set-Location $FRONTEND_DIR
    npm run build
    Set-Location ..
}

function Run-Backend {
    Write-ColorText "Démarrage du backend..." $Green
    Set-Location $BACKEND_DIR
    go run ./cmd/main.go
    Set-Location ..
}

function Run-Frontend {
    Write-ColorText "Démarrage du frontend..." $Green
    Set-Location $FRONTEND_DIR
    npm run dev
    Set-Location ..
}

function Start-Dev {
    Write-ColorText "Démarrage de l'environnement de développement..." $Green
    & $DOCKER_COMPOSE --env-file config.env up -d
}

function Start-Prod {
    Write-ColorText "Démarrage de l'environnement de production..." $Green
    & $DOCKER_COMPOSE --env-file config.prod.env up -d
}

function Stop-Services {
    Write-ColorText "Arrêt des services..." $Yellow
    & $DOCKER_COMPOSE down
}

function Show-Logs {
    & $DOCKER_COMPOSE logs -f
}

function Run-Tests {
    Write-ColorText "Exécution des tests..." $Green
    Set-Location $BACKEND_DIR
    go test ./...
    Set-Location ..
    Set-Location $FRONTEND_DIR
    npm test
    Set-Location ..
}

function Run-SecurityTest {
    Write-ColorText "Tests de sécurité..." $Green
    .\test-security.ps1
}

function Generate-Tokens {
    Write-ColorText "Génération de tokens sécurisés..." $Green
    node scripts/generate-tokens.js
}

function Clean-Project {
    Write-ColorText "Nettoyage..." $Yellow
    if (Test-Path "$BACKEND_DIR/main.exe") { Remove-Item "$BACKEND_DIR/main.exe" }
    if (Test-Path "$FRONTEND_DIR/dist") { Remove-Item "$FRONTEND_DIR/dist" -Recurse -Force }
    if (Test-Path "$FRONTEND_DIR/node_modules/.cache") { Remove-Item "$FRONTEND_DIR/node_modules/.cache" -Recurse -Force }
    & $DOCKER_COMPOSE down --volumes --remove-orphans
}

function Rebuild-Project {
    Clean-Project
    Build-Project
}

function Build-Docker {
    Write-ColorText "Construction des images Docker..." $Green
    & $DOCKER_COMPOSE build
}

function Rebuild-Docker {
    Write-ColorText "Reconstruction des images Docker..." $Green
    & $DOCKER_COMPOSE build --no-cache
}

function Check-Health {
    Write-ColorText "Vérification de la santé des services..." $Green

    try {
        Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing | Out-Null
        Write-ColorText "Backend: OK" $Green
    } catch {
        Write-ColorText "Backend: KO" $Red
    }

    try {
        Invoke-WebRequest -Uri "http://localhost:5173/health" -UseBasicParsing | Out-Null
        Write-ColorText "Frontend: OK" $Green
    } catch {
        Write-ColorText "Frontend: KO" $Red
    }

    try {
        Invoke-WebRequest -Uri "http://localhost:8025/" -UseBasicParsing | Out-Null
        Write-ColorText "MailHog: OK" $Green
    } catch {
        Write-ColorText "MailHog: KO" $Red
    }
}

function Backup-Database {
    Write-ColorText "Sauvegarde de la base de données..." $Green
    if (!(Test-Path "backups")) { New-Item -ItemType Directory -Name "backups" }

    if (Test-Path "data/app.db") {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        Copy-Item "data/app.db" "backups/app-$timestamp.db"
        Write-ColorText "Sauvegarde créée dans backups/app-$timestamp.db" $Green
    } else {
        Write-ColorText "Aucune base de données à sauvegarder" $Yellow
    }
}

function Restore-Database {
    Write-ColorText "Restauration de la dernière sauvegarde..." $Yellow
    $latest = Get-ChildItem "backups/app-*.db" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1

    if ($latest) {
        Copy-Item $latest.FullName "data/app.db"
        Write-ColorText "Base de données restaurée depuis $($latest.Name)" $Green
    } else {
        Write-ColorText "Aucune sauvegarde trouvée" $Red
    }
}

function Setup-Dev {
    Write-ColorText "Configuration de l'environnement de développement..." $Green

    if (!(Test-Path "config.env")) {
        Copy-Item "env.example" "config.env"
        Write-ColorText "Fichier config.env créé" $Green
    }

    @("data", "backups", "logs") | ForEach-Object {
        if (!(Test-Path $_)) { New-Item -ItemType Directory -Name $_ | Out-Null }
    }

    Install-Dependencies
    Write-ColorText "Environnement de développement prêt!" $Green
    Write-ColorText "Lancez '.\make.ps1 dev' pour démarrer" $Yellow
}

function Setup-Prod {
    Write-ColorText "Configuration de l'environnement de production..." $Green

    if (!(Test-Path "config.prod.env")) {
        Copy-Item "env.example" "config.prod.env"
        Write-ColorText "Fichier config.prod.env créé" $Green
        Write-ColorText "⚠️  Modifiez config.prod.env avec vos valeurs de production!" $Yellow
        Write-ColorText "⚠️  Utilisez '.\make.ps1 generate-tokens' pour créer des tokens sécurisés" $Yellow
    }

    @("data", "backups", "logs") | ForEach-Object {
        if (!(Test-Path $_)) { New-Item -ItemType Directory -Name $_ | Out-Null }
    }

    Write-ColorText "Configuration de production créée" $Green
}

function Lint-Code {
    Write-ColorText "Linting du code..." $Green
    Set-Location $BACKEND_DIR
    go fmt ./...
    Set-Location ..
    Set-Location $FRONTEND_DIR
    npm run lint
    Set-Location ..
}

function Format-Code {
    Write-ColorText "Formatage du code..." $Green
    Set-Location $BACKEND_DIR
    go fmt ./...
    Set-Location ..
    Set-Location $FRONTEND_DIR
    npm run lint --fix
    Set-Location ..
}

function Update-Dependencies {
    Write-ColorText "Mise à jour des dépendances..." $Green
    Set-Location $BACKEND_DIR
    go mod tidy
    go get -u ./...
    Set-Location ..
    Set-Location $FRONTEND_DIR
    npm update
    Set-Location ..
}

# Exécution de la commande
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "install" { Install-Dependencies }
    "build" { Build-Project }
    "run-backend" { Run-Backend }
    "run-frontend" { Run-Frontend }
    "dev" { Start-Dev }
    "prod" { Start-Prod }
    "stop" { Stop-Services }
    "logs" { Show-Logs }
    "test" { Run-Tests }
    "security-test" { Run-SecurityTest }
    "generate-tokens" { Generate-Tokens }
    "clean" { Clean-Project }
    "rebuild" { Rebuild-Project }
    "docker-build" { Build-Docker }
    "docker-rebuild" { Rebuild-Docker }
    "health-check" { Check-Health }
    "backup" { Backup-Database }
    "restore" { Restore-Database }
    "setup-dev" { Setup-Dev }
    "setup-prod" { Setup-Prod }
    "lint" { Lint-Code }
    "format" { Format-Code }
    "update" { Update-Dependencies }
    default {
        Write-ColorText "Commande inconnue: $Command" $Red
        Write-ColorText "Utilisez '.\make.ps1 help' pour voir les commandes disponibles" $Yellow
    }
}
