package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"

	"proxmox-dashboard/internal/email"
	"proxmox-dashboard/internal/models"
	"proxmox-dashboard/internal/sse"
	"proxmox-dashboard/internal/store"

	"github.com/go-chi/chi/v5"
)

// Handlers contient toutes les dépendances pour les handlers
type Handlers struct {
	store       *store.Store
	sseHub      *sse.Hub
	emailWorker *email.Worker
}

// New crée une nouvelle instance des handlers
func New(store *store.Store, sseHub *sse.Hub, emailWorker *email.Worker) *Handlers {
	return &Handlers{
		store:       store,
		sseHub:      sseHub,
		emailWorker: emailWorker,
	}
}

// Health endpoint
func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":      "ok",
		"timestamp":   time.Now().Unix(),
		"sse_clients": h.sseHub.GetClientCount(),
	}
	h.writeJSON(w, http.StatusOK, response)
}

// Apps handlers

func (h *Handlers) ListApps(w http.ResponseWriter, r *http.Request) {
	apps, err := h.store.ListApps()
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to list apps", err)
		return
	}
	h.writeJSON(w, http.StatusOK, apps)
}

func (h *Handlers) GetApp(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid app ID", err)
		return
	}

	app, err := h.store.GetApp(id)
	if err != nil {
		h.writeError(w, http.StatusNotFound, "App not found", err)
		return
	}

	h.writeJSON(w, http.StatusOK, app)
}

func (h *Handlers) CreateApp(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAppRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validation basique
	if req.Name == "" || req.Protocol == "" || req.Host == "" || req.Port <= 0 {
		h.writeError(w, http.StatusBadRequest, "Missing required fields", nil)
		return
	}

	// Valeurs par défaut
	if req.Path == "" {
		req.Path = "/"
	}
	if req.HealthPath == "" {
		req.HealthPath = "/health"
	}
	if req.HealthType == "" {
		req.HealthType = "http"
	}

	app, err := h.store.CreateApp(req)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to create app", err)
		return
	}

	h.writeJSON(w, http.StatusCreated, app)
}

func (h *Handlers) UpdateApp(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid app ID", err)
		return
	}

	var req models.CreateAppRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	app, err := h.store.UpdateApp(id, req)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to update app", err)
		return
	}

	h.writeJSON(w, http.StatusOK, app)
}

func (h *Handlers) DeleteApp(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid app ID", err)
		return
	}

	if err := h.store.DeleteApp(id); err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to delete app", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Health check handlers

func (h *Handlers) HealthCheckHTTP(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")
	if url == "" {
		h.writeError(w, http.StatusBadRequest, "Missing url parameter", nil)
		return
	}

	start := time.Now()
	resp, err := http.Get(url)
	latency := time.Since(start).Milliseconds()

	status := models.HealthStatus{
		Latency:   &latency,
		LastCheck: time.Now(),
	}

	if err != nil {
		status.Status = "offline"
		errorMsg := err.Error()
		status.Error = &errorMsg
	} else {
		defer resp.Body.Close()
		status.StatusCode = &resp.StatusCode
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			status.Status = "online"
		} else {
			status.Status = "offline"
		}
	}

	h.writeJSON(w, http.StatusOK, status)
}

func (h *Handlers) HealthCheckTCP(w http.ResponseWriter, r *http.Request) {
	host := r.URL.Query().Get("host")
	port := r.URL.Query().Get("port")

	if host == "" || port == "" {
		h.writeError(w, http.StatusBadRequest, "Missing host or port parameter", nil)
		return
	}

	start := time.Now()
	conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%s", host, port), 5*time.Second)
	latency := time.Since(start).Milliseconds()

	status := models.HealthStatus{
		Latency:   &latency,
		LastCheck: time.Now(),
	}

	if err != nil {
		status.Status = "offline"
		errorMsg := err.Error()
		status.Error = &errorMsg
	} else {
		status.Status = "online"
		conn.Close()
	}

	h.writeJSON(w, http.StatusOK, status)
}

// Database ping handler

func (h *Handlers) DatabasePing(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	// Simple ping à la base de données
	_, err := h.store.ListApps()
	latency := time.Since(start).Milliseconds()

	response := map[string]interface{}{
		"status":    "online",
		"latency":   latency,
		"timestamp": time.Now().Unix(),
	}

	if err != nil {
		response["status"] = "offline"
		response["error"] = err.Error()
		h.writeJSON(w, http.StatusServiceUnavailable, response)
		return
	}

	h.writeJSON(w, http.StatusOK, response)
}

// Alerts handlers

func (h *Handlers) ListAlerts(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 0
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	alerts, err := h.store.ListAlerts(limit)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to list alerts", err)
		return
	}

	h.writeJSON(w, http.StatusOK, alerts)
}

func (h *Handlers) CreateAlert(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAlertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validation
	if req.Source == "" || req.Severity == "" || req.Title == "" || req.Message == "" {
		h.writeError(w, http.StatusBadRequest, "Missing required fields", nil)
		return
	}

	alert, err := h.store.CreateAlert(req)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to create alert", err)
		return
	}

	// Diffuser l'alerte via SSE
	h.sseHub.BroadcastAlert(alert)

	// Envoyer des emails aux abonnés
	go h.sendAlertEmails(alert)

	h.writeJSON(w, http.StatusCreated, alert)
}

func (h *Handlers) AckAlert(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid alert ID", err)
		return
	}

	if err := h.store.AckAlert(id); err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to acknowledge alert", err)
		return
	}

	// Diffuser l'accusé de réception via SSE
	h.sseHub.BroadcastAck(id)

	w.WriteHeader(http.StatusNoContent)
}

// SSE handler
func (h *Handlers) AlertsStream(w http.ResponseWriter, r *http.Request) {
	h.sseHub.ServeSSE(w, r)
}

// Notifications handlers

func (h *Handlers) NotifyTest(w http.ResponseWriter, r *http.Request) {
	var req models.NotifyTestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if req.To == "" {
		h.writeError(w, http.StatusBadRequest, "Missing 'to' field", nil)
		return
	}

	if err := h.emailWorker.SendTestEmail(req.To); err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to send test email", err)
		return
	}

	response := map[string]interface{}{
		"message": "Test email queued successfully",
		"to":      req.To,
	}
	h.writeJSON(w, http.StatusOK, response)
}

func (h *Handlers) Subscribe(w http.ResponseWriter, r *http.Request) {
	var req models.SubscribeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if req.Channel == "" || req.Endpoint == "" {
		h.writeError(w, http.StatusBadRequest, "Missing required fields", nil)
		return
	}

	subscription, err := h.store.AddSubscription(req)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Failed to create subscription", err)
		return
	}

	h.writeJSON(w, http.StatusCreated, subscription)
}

// Fonctions utilitaires

func (h *Handlers) sendAlertEmails(alert *models.Alert) {
	subscriptions, err := h.store.ListEmailSubscriptions()
	if err != nil {
		log.Printf("Error getting email subscriptions: %v", err)
		return
	}

	for _, sub := range subscriptions {
		if err := h.emailWorker.SendAlertEmail(sub.Endpoint, alert); err != nil {
			log.Printf("Error sending alert email to %s: %v", sub.Endpoint, err)
		}
	}
}

func (h *Handlers) writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *Handlers) writeError(w http.ResponseWriter, status int, message string, err error) {
	response := map[string]interface{}{
		"error":  message,
		"status": status,
	}

	if err != nil {
		log.Printf("Error: %s - %v", message, err)
		response["details"] = err.Error()
	}

	h.writeJSON(w, status, response)
}
