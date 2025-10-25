package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"proxmox-dashboard/internal/models"
	"proxmox-dashboard/internal/store"
)

// Handlers contient tous les handlers HTTP
type Handlers struct {
	store *store.Store
}

// NewHandlers crée une nouvelle instance de Handlers
func NewHandlers(store *store.Store) *Handlers {
	return &Handlers{store: store}
}

// GetApps récupère toutes les applications
func (h *Handlers) GetApps(w http.ResponseWriter, r *http.Request) {
	apps, err := h.store.GetApps()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get apps: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apps)
}

// CreateApp crée une nouvelle application
func (h *Handlers) CreateApp(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAppRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	app := &models.App{
		Name:       req.Name,
		Protocol:   req.Protocol,
		Host:       req.Host,
		Port:       req.Port,
		Path:       req.Path,
		Tag:        req.Tag,
		Icon:       req.Icon,
		HealthPath: req.HealthPath,
		HealthType: req.HealthType,
		CreatedAt:  time.Now(),
	}

	if err := app.Validate(); err != nil {
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	if err := h.store.CreateApp(app); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create app: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(app)
}

// UpdateApp met à jour une application
func (h *Handlers) UpdateApp(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/apps/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid app ID", http.StatusBadRequest)
		return
	}

	var req models.CreateAppRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.store.UpdateApp(id, req); err != nil {
		http.Error(w, fmt.Sprintf("Failed to update app: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// DeleteApp supprime une application
func (h *Handlers) DeleteApp(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/api/apps/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid app ID", http.StatusBadRequest)
		return
	}

	if err := h.store.DeleteApp(id); err != nil {
		http.Error(w, fmt.Sprintf("Failed to delete app: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetAlerts récupère toutes les alertes
func (h *Handlers) GetAlerts(w http.ResponseWriter, r *http.Request) {
	alerts, err := h.store.GetAlerts()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get alerts: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alerts)
}

// CreateAlert crée une nouvelle alerte
func (h *Handlers) CreateAlert(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAlertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	alert := &models.Alert{
		Source:       req.Source,
		Severity:     req.Severity,
		Title:        req.Title,
		Message:      req.Message,
		Payload:      req.Payload,
		CreatedAt:    time.Now(),
		Acknowledged: false,
	}

	if err := alert.Validate(); err != nil {
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	if err := h.store.CreateAlert(alert); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create alert: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(alert)
}

// GetHealth retourne le statut de santé de l'API
func (h *Handlers) GetHealth(w http.ResponseWriter, r *http.Request) {
	health := map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().Unix(),
		"version":   "1.0.0",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}

// GetHealthHTTP vérifie la santé d'une URL HTTP
func (h *Handlers) GetHealthHTTP(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")
	if url == "" {
		http.Error(w, "URL parameter is required", http.StatusBadRequest)
		return
	}

	// Simuler une vérification HTTP
	result := map[string]interface{}{
		"url":       url,
		"status":    "ok",
		"latency":   100,
		"timestamp": time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// GetHealthTCP vérifie la santé d'une connexion TCP
func (h *Handlers) GetHealthTCP(w http.ResponseWriter, r *http.Request) {
	host := r.URL.Query().Get("host")
	port := r.URL.Query().Get("port")

	if host == "" || port == "" {
		http.Error(w, "Host and port parameters are required", http.StatusBadRequest)
		return
	}

	// Simuler une vérification TCP
	result := map[string]interface{}{
		"host":      host,
		"port":      port,
		"status":    "ok",
		"latency":   50,
		"timestamp": time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// TestEmail teste l'envoi d'un email
func (h *Handlers) TestEmail(w http.ResponseWriter, r *http.Request) {
	var req models.NotifyTestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Simuler l'envoi d'un email de test
	email := &models.EmailQueue{
		ToAddr:    req.To,
		Subject:   "Test Email",
		BodyText:  "This is a test email from ProxmoxDash",
		State:     "pending",
		CreatedAt: time.Now(),
	}

	if err := h.store.CreateEmailQueue(email); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create test email: %v", err), http.StatusInternalServerError)
		return
	}

	result := map[string]string{
		"message": "Test email queued successfully",
		"to":      req.To,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// SubscribeNotification crée un nouvel abonnement aux notifications
func (h *Handlers) SubscribeNotification(w http.ResponseWriter, r *http.Request) {
	var req models.SubscribeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	sub := &models.NotifySubscription{
		Channel:   req.Channel,
		Endpoint:  req.Endpoint,
		Enabled:   true,
		CreatedAt: time.Now(),
	}

	if err := sub.Validate(); err != nil {
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	if err := h.store.CreateNotificationSubscription(sub); err != nil {
		http.Error(w, fmt.Sprintf("Failed to create subscription: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(sub)
}

// StreamAlerts gère le streaming SSE pour les alertes
func (h *Handlers) StreamAlerts(w http.ResponseWriter, r *http.Request) {
	// Vérifier l'authentification via le token dans les paramètres de requête
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Token d'authentification requis", http.StatusUnauthorized)
		return
	}

	// Configuration SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Cache-Control")

	// Vérifier que le ResponseWriter supporte le flush
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Envoyer un événement de connexion
	fmt.Fprintf(w, "event: connected\n")
	fmt.Fprintf(w, "data: {\"message\": \"Connected to NexBoard alerts stream\"}\n\n")
	flusher.Flush()

	// Envoyer une alerte de test seulement si c'est la première connexion de la session
	// Vérifier si l'alerte de bienvenue a déjà été envoyée dans cette session
	sessionKey := r.Header.Get("X-Session-ID")
	if sessionKey == "" {
		sessionKey = r.RemoteAddr // Utiliser l'adresse IP comme clé de session
	}

	// Cache simple en mémoire pour éviter les alertes répétées
	// Dans un vrai système, on utiliserait Redis ou une base de données
	go func() {
		time.Sleep(3 * time.Second)
		// Pour l'instant, on désactive l'alerte de test pour éviter les boucles
		// testAlert := map[string]interface{}{
		// 	"id":           1,
		// 	"source":       "system",
		// 	"severity":     "info",
		// 	"title":        "Bienvenue sur NexBoard",
		// 	"message":      "Système de notifications opérationnel",
		// 	"created_at":   time.Now().Format(time.RFC3339),
		// 	"acknowledged": false,
		// }
		//
		// alertData, _ := json.Marshal(testAlert)
		// fmt.Fprintf(w, "event: alert\n")
		// fmt.Fprintf(w, "data: %s\n\n", string(alertData))
		// flusher.Flush()
	}()

	// Boucle infinie simple pour maintenir la connexion
	for {
		select {
		case <-r.Context().Done():
			// Connexion fermée par le client
			return
		default:
			// Attendre un peu et envoyer un ping
			time.Sleep(10 * time.Second)
			fmt.Fprintf(w, "event: ping\n")
			fmt.Fprintf(w, "data: {\"timestamp\": %d, \"message\": \"Heartbeat\"}\n\n", time.Now().Unix())
			flusher.Flush()
		}
	}
}

// ClearDatabase vide complètement la base de données
func (h *Handlers) ClearDatabase(w http.ResponseWriter, r *http.Request) {
	// Vérifier que la méthode est POST
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Vider la base de données
	if err := h.store.ClearDatabase(); err != nil {
		http.Error(w, fmt.Sprintf("Failed to clear database: %v", err), http.StatusInternalServerError)
		return
	}

	// Retourner une réponse de succès
	response := map[string]interface{}{
		"success":   true,
		"message":   "Database cleared successfully",
		"timestamp": time.Now().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
