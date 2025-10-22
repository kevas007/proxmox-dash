package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"proxmox-dashboard/internal/auth"
	"proxmox-dashboard/internal/email"
	"proxmox-dashboard/internal/handlers"
	custommiddleware "proxmox-dashboard/internal/middleware"
	"proxmox-dashboard/internal/sse"
	"proxmox-dashboard/internal/store"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// Configuration
	port := getEnv("PORT", "8080")
	dbPath := getEnv("DB_PATH", "./data/app.db")
	corsOrigins := getEnv("CORS_ORIGINS", "http://localhost:5173")

	log.Printf("Starting ProxmoxDash API server on port %s", port)
	log.Printf("Database path: %s", dbPath)

	// Initialiser le store
	store, err := store.New(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize store: %v", err)
	}
	defer store.Close()

	// Initialiser le hub SSE
	sseHub := sse.NewHub()
	sseHub.Start()

	// Initialiser le worker email
	emailWorker := email.NewWorker(store)
	emailWorker.Start()

	// Initialiser le service d'authentification
	authService := auth.NewService(store.DB())

	// Initialiser les handlers
	h := handlers.New(store, sseHub, emailWorker)
	authHandlers := handlers.NewAuthHandlers(authService)

	// Configuration du router
	r := chi.NewRouter()

	// Middleware de base
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Timeout(60 * time.Second))

	// Middleware de sécurité
	r.Use(custommiddleware.SecurityHeaders)
	r.Use(custommiddleware.ValidateInput)
	r.Use(custommiddleware.IPWhitelist)

	// CORS sécurisé
	corsOriginsList := strings.Split(corsOrigins, ",")
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOriginsList,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Requested-With"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes publiques (pas d'auth requise)
	r.Get("/api/health", h.Health)
	r.Get("/api/db/ping", h.DatabasePing)

	// Routes d'authentification
	r.Route("/api/auth", func(r chi.Router) {
		// Routes publiques
		r.Post("/login", authHandlers.Login)

		// Routes avec authentification
		r.Group(func(r chi.Router) {
			r.Use(custommiddleware.JWTAuthMiddleware(authService))

			r.Post("/logout", authHandlers.Logout)
			r.Get("/me", authHandlers.Me)
			r.Post("/change-password", authHandlers.ChangePassword)
			r.Get("/permissions", authHandlers.GetUserPermissions)
			r.Get("/roles", authHandlers.GetUserRoles)

			// Routes admin seulement
			r.Group(func(r chi.Router) {
				r.Use(custommiddleware.RequireRole("admin"))

				r.Get("/users", authHandlers.ListUsers)
				r.Post("/users", authHandlers.CreateUser)
				r.Get("/users/{id}", authHandlers.GetUser)
				r.Put("/users/{id}", authHandlers.UpdateUser)
			})
		})
	})

	// Routes avec authentification optionnelle
	r.Group(func(r chi.Router) {
		r.Use(custommiddleware.OptionalAuthMiddleware)

		// Health checks (lecture seule)
		r.Get("/api/health/http", h.HealthCheckHTTP)
		r.Get("/api/health/tcp", h.HealthCheckTCP)

		// Alertes (lecture seule)
		r.Get("/api/alerts", h.ListAlerts)
	})

	// Routes protégées (authentification requise)
	r.Group(func(r chi.Router) {
		r.Use(custommiddleware.AdminOnlyMiddleware)

		// Gestion des applications
		r.Route("/api/apps", func(r chi.Router) {
			r.Get("/", h.ListApps)
			r.Post("/", h.CreateApp)
			r.Get("/{id}", h.GetApp)
			r.Put("/{id}", h.UpdateApp)
			r.Delete("/{id}", h.DeleteApp)
		})

		// Gestion des alertes (écriture)
		r.Post("/api/alerts", h.CreateAlert)
		r.Post("/api/alerts/{id}/ack", h.AckAlert)

		// Notifications et abonnements
		r.Route("/api/notify", func(r chi.Router) {
			r.Post("/test", h.NotifyTest)
			r.Post("/subscribe", h.Subscribe)
		})
	})

	// Routes avec authentification JWT (pour les utilisateurs connectés)
	r.Group(func(r chi.Router) {
		r.Use(custommiddleware.JWTAuthMiddleware(authService))

		// Stream SSE pour les notifications (authentification requise)
		r.Get("/api/alerts/stream", h.AlertsStream)
	})

	// Serveur HTTP
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Démarrage du serveur dans une goroutine
	go func() {
		log.Printf("Server listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Attendre le signal d'arrêt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Arrêt gracieux
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Arrêter le worker email
	emailWorker.Stop()

	// Arrêter le serveur HTTP
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server stopped")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
