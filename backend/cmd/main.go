package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"proxmox-dashboard/internal/config"
	"proxmox-dashboard/internal/handlers"
	"proxmox-dashboard/internal/routes"
	"proxmox-dashboard/internal/sse"
	"proxmox-dashboard/internal/store"

	_ "modernc.org/sqlite"
)

func main() {
	// Charger la configuration
	cfg := config.Load()

	// Configuration de la base de données
	db, err := sql.Open("sqlite", cfg.Database.Path)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Créer le store
	store := store.NewStore(db)

	// Exécuter les migrations
	if err := store.Migrate(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Créer le hub SSE
	hub := sse.NewHub()
	hub.Start()

	// Créer les handlers
	handlers := handlers.NewHandlers(store)

	// Configuration du routeur
	r := routes.SetupRoutes(handlers, hub)

	// Démarrer le serveur
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	fmt.Printf("Server starting on %s\n", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}
