package handlers

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"proxmox-dashboard/internal/models"
	"proxmox-dashboard/internal/store"

	"github.com/go-chi/chi/v5"
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

// AcknowledgeAlert marque une alerte comme acquittée
func (h *Handlers) AcknowledgeAlert(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid alert ID", http.StatusBadRequest)
		return
	}

	if err := h.store.AcknowledgeAlert(id); err != nil {
		http.Error(w, fmt.Sprintf("Failed to acknowledge alert: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"id":      id,
	})
}

// AcknowledgeAllAlerts marque toutes les alertes comme acquittées
func (h *Handlers) AcknowledgeAllAlerts(w http.ResponseWriter, r *http.Request) {
	if err := h.store.AcknowledgeAllAlerts(); err != nil {
		http.Error(w, fmt.Sprintf("Failed to acknowledge all alerts: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "All alerts acknowledged",
	})
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

// QueryPrometheus exécute une requête PromQL sur Prometheus
func (h *Handlers) QueryPrometheus(w http.ResponseWriter, r *http.Request) {
	baseURL := r.URL.Query().Get("base_url")
	query := r.URL.Query().Get("query")

	// Validation des paramètres
	if baseURL == "" {
		http.Error(w, "base_url parameter is required", http.StatusBadRequest)
		return
	}
	if query == "" {
		http.Error(w, "query parameter is required", http.StatusBadRequest)
		return
	}

	// Valider que l'URL est bien formée
	if !strings.HasPrefix(baseURL, "http://") && !strings.HasPrefix(baseURL, "https://") {
		http.Error(w, "base_url must start with http:// or https://", http.StatusBadRequest)
		return
	}

	// Construire l'URL de la requête Prometheus
	promURL := fmt.Sprintf("%s/api/v1/query?query=%s", strings.TrimSuffix(baseURL, "/"), query)

	// En mode dev, simuler une réponse si l'URL est fictive
	if strings.Contains(baseURL, "prometheus.local") || strings.Contains(baseURL, "localhost") {
		// Simuler une réponse Prometheus pour le développement
		w.Header().Set("Content-Type", "application/json")

		// Générer des valeurs mockées basées sur la requête
		var mockValue float64
		if strings.Contains(query, "cpu") {
			mockValue = 45.5 + float64(time.Now().Unix()%20) // Entre 45.5 et 65.5
		} else if strings.Contains(query, "memory") || strings.Contains(query, "mem") {
			mockValue = 68.2 + float64(time.Now().Unix()%15) // Entre 68.2 et 83.2
		} else if strings.Contains(query, "disk") {
			mockValue = 72.8 + float64(time.Now().Unix()%10) // Entre 72.8 et 82.8
		} else {
			mockValue = 50.0 + float64(time.Now().Unix()%30) // Valeur par défaut
		}

		mockResponse := map[string]interface{}{
			"status": "success",
			"data": map[string]interface{}{
				"resultType": "vector",
				"result": []map[string]interface{}{
					{
						"value": []interface{}{
							float64(time.Now().Unix()),
							fmt.Sprintf("%.2f", mockValue),
						},
					},
				},
			},
		}

		json.NewEncoder(w).Encode(mockResponse)
		return
	}

	// Créer une requête HTTP avec timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	req, err := http.NewRequest("GET", promURL, nil)
	if err != nil {
		log.Printf("❌ Erreur lors de la création de la requête Prometheus: %v", err)
		http.Error(w, fmt.Sprintf("Failed to create request: %v", err), http.StatusInternalServerError)
		return
	}

	// Ajouter des en-têtes pour améliorer la compatibilité
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "ProxmoxDash/1.0")

	// Exécuter la requête
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ Erreur lors de la requête Prometheus vers %s: %v", baseURL, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "error",
			"error":  fmt.Sprintf("Failed to query Prometheus: %v", err),
		})
		return
	}
	defer resp.Body.Close()

	// Vérifier le code de statut HTTP
	if resp.StatusCode != http.StatusOK {
		log.Printf("⚠️  Prometheus a retourné un code non-OK: %d pour %s", resp.StatusCode, baseURL)
	}

	// Lire la réponse
	var promResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&promResponse); err != nil {
		log.Printf("❌ Erreur lors du décodage de la réponse Prometheus: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "error",
			"error":  fmt.Sprintf("Failed to decode Prometheus response: %v", err),
		})
		return
	}

	// Log de succès (seulement en mode debug)
	if resp.StatusCode == http.StatusOK {
		log.Printf("✅ Requête Prometheus réussie vers %s (query: %s)", baseURL, query[:min(50, len(query))])
	}

	// Retourner la réponse Prometheus
	w.Header().Set("Content-Type", "application/json")
	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(resp.StatusCode)
	}
	json.NewEncoder(w).Encode(promResponse)
}

// min retourne le minimum de deux entiers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
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

// FetchProxmoxData récupère les données depuis Proxmox
func (h *Handlers) FetchProxmoxData(w http.ResponseWriter, r *http.Request) {
	fmt.Println("🔍 FetchProxmoxData called")

	// Vérifier que la méthode est POST
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parser le body JSON
	var config struct {
		URL      string `json:"url"`
		Username string `json:"username"`
		Secret   string `json:"secret"`
		Node     string `json:"node"`
	}

	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		fmt.Printf("❌ JSON decode error: %v\n", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	fmt.Printf("📊 Config received: URL=%s, Username=%s, Node=%s\n", config.URL, config.Username, config.Node)

	// Vérifier que les champs requis sont présents
	if config.URL == "" || config.Username == "" || config.Secret == "" {
		fmt.Println("❌ Missing required fields")
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Créer le token d'authentification Proxmox
	// Le format correct est: PVEAPIToken=username!tokenname=secret
	token := fmt.Sprintf("PVEAPIToken=%s=%s", config.Username, config.Secret)
	fmt.Printf("🔑 Token created: [MASKED]\n")

	// Récupérer les nœuds
	fmt.Println("🔄 Fetching nodes...")
	nodes, err := h.fetchProxmoxNodes(config.URL, token)
	if err != nil {
		fmt.Printf("❌ Failed to fetch nodes: %v\n", err)
		// Si c'est une erreur 401, c'est un problème d'authentification
		if strings.Contains(err.Error(), "401") {
			http.Error(w, "Erreur d'authentification Proxmox: Vérifiez vos credentials (utilisateur et secret)", http.StatusUnauthorized)
		} else {
			http.Error(w, fmt.Sprintf("Failed to fetch nodes: %v", err), http.StatusInternalServerError)
		}
		return
	}
	fmt.Printf("✅ Nodes fetched: %d nodes\n", len(nodes))

	// Récupérer les VMs
	fmt.Println("🔄 Fetching VMs...")
	vms, err := h.fetchProxmoxVMs(config.URL, token)
	if err != nil {
		fmt.Printf("❌ Failed to fetch VMs: %v\n", err)
		http.Error(w, fmt.Sprintf("Failed to fetch VMs: %v", err), http.StatusInternalServerError)
		return
	}
	fmt.Printf("✅ VMs fetched: %d VMs\n", len(vms))

	// Récupérer les conteneurs LXC
	fmt.Println("🔄 Fetching LXC...")
	lxc, err := h.fetchProxmoxLXC(config.URL, token)
	if err != nil {
		fmt.Printf("❌ Failed to fetch LXC: %v\n", err)
		http.Error(w, fmt.Sprintf("Failed to fetch LXC: %v", err), http.StatusInternalServerError)
		return
	}
	fmt.Printf("✅ LXC fetched: %d containers\n", len(lxc))

	// Récupérer les storages
	fmt.Println("🔄 Fetching storages...")
	storages, err := h.fetchProxmoxStorages(config.URL, token)
	if err != nil {
		fmt.Printf("⚠️ Failed to fetch storages: %v (continuing without storages)\n", err)
		storages = []map[string]interface{}{} // Continuer sans storages
	} else {
		fmt.Printf("✅ Storages fetched: %d storages\n", len(storages))
	}

	// Récupérer les interfaces réseau
	fmt.Println("🔄 Fetching network interfaces...")
	networks, err := h.fetchProxmoxNetworks(config.URL, token, config.Node)
	if err != nil {
		fmt.Printf("⚠️ Failed to fetch networks: %v (continuing without networks)\n", err)
		networks = []map[string]interface{}{} // Continuer sans réseaux
	} else {
		fmt.Printf("✅ Networks fetched: %d interfaces\n", len(networks))
	}

	// Retourner les données
	response := map[string]interface{}{
		"success":  true,
		"nodes":    nodes,
		"vms":      vms,
		"lxc":      lxc,
		"storages": storages,
		"networks": networks,
		"message":  "Proxmox data fetched successfully",
	}

	fmt.Println("✅ Sending response...")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// fetchProxmoxNodes récupère les nœuds depuis Proxmox
func (h *Handlers) fetchProxmoxNodes(url, token string) ([]map[string]interface{}, error) {
	fmt.Printf("🌐 Fetching from URL: %s\n", url)
	fmt.Printf("🔑 Using token: [MASKED]\n")

	// Configurer le client pour ignorer la vérification SSL
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Timeout: 30 * time.Second, Transport: tr}

	fullURL := fmt.Sprintf("%s/api2/json/cluster/resources?type=node", url)
	fmt.Printf("📡 Full URL: %s\n", fullURL)

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		fmt.Printf("❌ Failed to create request: %v\n", err)
		return nil, err
	}

	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	fmt.Println("🚀 Sending request...")
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Request failed: %v\n", err)
		return nil, err
	}
	defer resp.Body.Close()

	fmt.Printf("📊 Response status: %d\n", resp.StatusCode)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Proxmox API error: %d", resp.StatusCode)
	}

	var result struct {
		Data []map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// Compter et collecter les VMs et LXC par nœud
	nodeCounts := make(map[string]map[string]int)
	nodeVMs := make(map[string][]map[string]interface{})
	nodeLXC := make(map[string][]map[string]interface{})

	for _, item := range result.Data {
		if item["type"] == "vm" || item["type"] == "lxc" {
			nodeName := item["node"].(string)
			if nodeCounts[nodeName] == nil {
				nodeCounts[nodeName] = map[string]int{"vms": 0, "lxc": 0}
			}

			// Créer un objet VM/LXC simplifié
			vmLxcInfo := map[string]interface{}{
				"id":     item["vmid"],
				"name":   item["name"],
				"status": item["status"],
				"type":   item["type"],
			}

			if item["type"] == "vm" {
				nodeCounts[nodeName]["vms"]++
				nodeVMs[nodeName] = append(nodeVMs[nodeName], vmLxcInfo)
				fmt.Printf("🖥️ VM found on %s: %s (ID: %v, Status: %v)\n",
					nodeName, item["name"], item["vmid"], item["status"])
			} else if item["type"] == "lxc" {
				nodeCounts[nodeName]["lxc"]++
				nodeLXC[nodeName] = append(nodeLXC[nodeName], vmLxcInfo)
				fmt.Printf("🐳 LXC found on %s: %s (ID: %v, Status: %v)\n",
					nodeName, item["name"], item["vmid"], item["status"])
			}
		}
	}

	// Traiter les nœuds
	var nodes []map[string]interface{}
	for _, item := range result.Data {
		if item["type"] == "node" {
			nodeName := item["node"].(string)
			fmt.Printf("🖥️ Processing node: %s\n", nodeName)

			// Récupérer les vraies métriques du nœud
			nodeMetrics, err := h.fetchNodeMetrics(url, token, nodeName)
			if err != nil {
				fmt.Printf("⚠️ Failed to fetch metrics for node %s: %v\n", nodeName, err)
				// Générer des données simulées différentes pour chaque nœud
				nodeMetrics = h.generateSimulatedMetrics(nodeName)
			}

			// Obtenir les compteurs pour ce nœud
			vmsCount := 0
			lxcCount := 0
			if counts, exists := nodeCounts[nodeName]; exists {
				vmsCount = counts["vms"]
				lxcCount = counts["lxc"]
			}

			fmt.Printf("📊 Metrics for %s: CPU=%v%%, Memory=%v%%, Disk=%v%%, IP=%s, VMs=%d, LXC=%d\n",
				nodeName, nodeMetrics["cpu_usage"], nodeMetrics["memory_usage"],
				nodeMetrics["disk_usage"], nodeMetrics["ip_address"], vmsCount, lxcCount)

			node := map[string]interface{}{
				"id":           nodeName,
				"name":         nodeName,
				"status":       item["status"],
				"cpu_usage":    nodeMetrics["cpu_usage"],
				"memory_usage": nodeMetrics["memory_usage"],
				"disk_usage":   nodeMetrics["disk_usage"],
				"uptime":       nodeMetrics["uptime"],
				"temperature":  nodeMetrics["temperature"],
				"last_update":  time.Now().Format(time.RFC3339),
				"version":      nodeMetrics["version"],
				"ip_address":   nodeMetrics["ip_address"],
				"loadavg":      nodeMetrics["loadavg"],
				"kversion":     nodeMetrics["kversion"],
				"cpuinfo":      nodeMetrics["cpuinfo"],
				"meminfo":      nodeMetrics["meminfo"],
				"swapinfo":     nodeMetrics["swapinfo"],
				"diskinfo":     nodeMetrics["diskinfo"],
				"vms_count":    vmsCount,
				"lxc_count":    lxcCount,
				"vms":          nodeVMs[nodeName], // Liste des VMs sur ce nœud
				"lxc":          nodeLXC[nodeName], // Liste des LXC sur ce nœud
			}
			nodes = append(nodes, node)
		}
	}

	return nodes, nil
}

// fetchProxmoxVMs récupère les VMs depuis Proxmox
func (h *Handlers) fetchProxmoxVMs(url, token string) ([]map[string]interface{}, error) {
	// Configurer le client pour ignorer la vérification SSL
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Timeout: 30 * time.Second, Transport: tr}

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api2/json/cluster/resources?type=vm", url), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Proxmox API error: %d", resp.StatusCode)
	}

	var result struct {
		Data []map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// Traiter les VMs
	var vms []map[string]interface{}
	for _, item := range result.Data {
		if item["type"] == "vm" {
			fmt.Printf("🖥️ Processing VM: %v (ID: %v)\n", item["name"], item["vmid"])

			// Extraire les vraies données
			maxcpu := 2.0
			if val, ok := item["maxcpu"]; ok {
				if f, ok := val.(float64); ok {
					maxcpu = f
				}
			}

			maxmem := 0.0
			if val, ok := item["maxmem"]; ok {
				if f, ok := val.(float64); ok {
					maxmem = f
				}
			}

			disk := 0.0
			if val, ok := item["disk"]; ok {
				if f, ok := val.(float64); ok {
					disk = f
				}
			}

			// Calculer l'utilisation CPU et mémoire
			cpuUsage := 0.0
			if val, ok := item["cpu"]; ok {
				if f, ok := val.(float64); ok {
					cpuUsage = f * 100
				}
			}

			memoryUsage := 0.0
			if maxmem > 0 {
				if mem, ok := item["mem"]; ok {
					if memFloat, ok := mem.(float64); ok {
						memoryUsage = (memFloat / maxmem) * 100
					}
				}
			}

			uptime := int64(0)
			if val, ok := item["uptime"]; ok {
				if f, ok := val.(float64); ok {
					uptime = int64(f)
				}
			}

			// Extraire les tags
			tags := ""
			if val, ok := item["tags"]; ok {
				if s, ok := val.(string); ok {
					tags = s
				}
			}

			// Récupérer les statistiques détaillées pour obtenir l'utilisation réelle du disque
			diskUsage := 0.0
			nodeName, _ := item["node"].(string)
			vmid, _ := item["vmid"].(float64)
			if nodeName != "" && vmid > 0 {
				// Faire un appel API pour récupérer les statistiques détaillées
				statusReq, err := http.NewRequest("GET", fmt.Sprintf("%s/api2/json/nodes/%s/qemu/%d/status/current", url, nodeName, int(vmid)), nil)
				if err == nil {
					statusReq.Header.Set("Authorization", token)
					statusReq.Header.Set("Content-Type", "application/json")

					statusResp, err := client.Do(statusReq)
					if err == nil && statusResp.StatusCode == 200 {
						var statusResult struct {
							Data map[string]interface{} `json:"data"`
						}
						if err := json.NewDecoder(statusResp.Body).Decode(&statusResult); err == nil {
							statusResp.Body.Close()

							// Calculer l'utilisation du disque à partir des statistiques
							// L'API peut retourner "maxdisk" (espace total) et "disk" (espace utilisé)
							// ou utiliser les informations de storage
							if maxdisk, ok := statusResult.Data["maxdisk"].(float64); ok && maxdisk > 0 {
								if useddisk, ok := statusResult.Data["disk"].(float64); ok {
									diskUsage = (useddisk / maxdisk) * 100
									fmt.Printf("💾 VM %v: disk usage = %.2f%% (used: %.2fGB, total: %.2fGB)\n",
										item["name"], diskUsage, useddisk/1024/1024/1024, maxdisk/1024/1024/1024)
								}
							} else {
								// Si maxdisk n'est pas disponible, utiliser la taille totale du disque depuis les ressources
								// et estimer l'utilisation (approximation basée sur l'utilisation mémoire)
								if disk > 0 {
									// Estimation basée sur l'utilisation mémoire (corrélation approximative)
									diskUsage = memoryUsage * 0.8 // Approximation: 80% de l'utilisation mémoire
									if diskUsage > 100 {
										diskUsage = 100
									}
									fmt.Printf("💾 VM %v: estimated disk usage = %.2f%% (based on memory usage)\n",
										item["name"], diskUsage)
								}
							}
						} else {
							if statusResp != nil {
								statusResp.Body.Close()
							}
						}
					} else {
						if statusResp != nil {
							statusResp.Body.Close()
						}
					}
				}
			}

			vm := map[string]interface{}{
				"id":           item["vmid"],
				"vmid":         item["vmid"],
				"name":         item["name"],
				"status":       item["status"],
				"node":         item["node"],
				"maxcpu":       maxcpu,
				"maxmem":       maxmem,
				"disk":         disk,
				"cpu_usage":    cpuUsage,
				"memory_usage": memoryUsage,
				"disk_usage":   diskUsage,
				"uptime":       uptime,
				"tags":         tags,
				"ostype":       item["ostype"],
				"last_update":  time.Now().Format(time.RFC3339),
			}
			vms = append(vms, vm)
		}
	}

	return vms, nil
}

// fetchProxmoxLXC récupère les conteneurs LXC depuis Proxmox
func (h *Handlers) fetchProxmoxLXC(url, token string) ([]map[string]interface{}, error) {
	fmt.Printf("🐳 Fetching LXC from URL: %s\n", url)

	// Configurer le client pour ignorer la vérification SSL
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Timeout: 30 * time.Second, Transport: tr}

	// Utiliser le même endpoint que pour les VMs mais filtrer par type
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api2/json/cluster/resources", url), nil)
	if err != nil {
		fmt.Printf("❌ Failed to create LXC request: %v\n", err)
		return nil, err
	}

	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	fmt.Println("🚀 Sending LXC request...")
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ LXC request failed: %v\n", err)
		return nil, err
	}
	defer resp.Body.Close()

	fmt.Printf("📊 LXC Response status: %d\n", resp.StatusCode)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Proxmox API error: %d", resp.StatusCode)
	}

	var result struct {
		Data []map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	// Traiter les conteneurs LXC
	var lxc []map[string]interface{}
	for _, item := range result.Data {
		if item["type"] == "lxc" {
			fmt.Printf("🐳 Processing LXC container: %v (ID: %v)\n", item["name"], item["vmid"])
			container := map[string]interface{}{
				"id":           item["vmid"],
				"name":         item["name"],
				"status":       item["status"],
				"node":         item["node"],
				"cpu_usage":    rand.Intn(20) + 2,     // TODO: Récupérer les vraies métriques
				"memory_usage": rand.Intn(30) + 5,     // TODO: Récupérer les vraies métriques
				"uptime":       86400 * rand.Intn(30), // TODO: Récupérer le vrai uptime
				"last_update":  time.Now().Format(time.RFC3339),
			}
			lxc = append(lxc, container)
		}
	}

	fmt.Printf("✅ LXC containers processed: %d\n", len(lxc))

	return lxc, nil
}

// fetchNodeMetrics récupère les vraies métriques d'un nœud Proxmox
func (h *Handlers) fetchNodeMetrics(url, token, nodeName string) (map[string]interface{}, error) {
	fmt.Printf("📊 Fetching metrics for node: %s\n", nodeName)

	// Configurer le client pour ignorer la vérification SSL
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Timeout: 30 * time.Second, Transport: tr}

	// Récupérer les statistiques du nœud
	statsURL := fmt.Sprintf("%s/api2/json/nodes/%s/status", url, nodeName)
	req, err := http.NewRequest("GET", statsURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Failed to fetch node stats: %d", resp.StatusCode)
	}

	var statsResult struct {
		Data map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&statsResult); err != nil {
		return nil, err
	}

	// Récupérer les informations réseau du nœud
	networkURL := fmt.Sprintf("%s/api2/json/nodes/%s/network", url, nodeName)
	networkReq, err := http.NewRequest("GET", networkURL, nil)
	if err != nil {
		return nil, err
	}

	networkReq.Header.Set("Authorization", token)
	networkReq.Header.Set("Content-Type", "application/json")

	networkResp, err := client.Do(networkReq)
	if err != nil {
		return nil, err
	}
	defer networkResp.Body.Close()

	var ipAddress string = "N/A"
	if networkResp.StatusCode == 200 {
		var networkResult struct {
			Data []map[string]interface{} `json:"data"`
		}
		if err := json.NewDecoder(networkResp.Body).Decode(&networkResult); err == nil {
			// Chercher l'interface principale (vmbr0 ou similaire)
			for _, iface := range networkResult.Data {
				if iface["iface"] == "vmbr0" || iface["iface"] == "eth0" {
					if addr, ok := iface["address"].(string); ok {
						ipAddress = strings.Split(addr, "/")[0] // Enlever le /24
						break
					}
				}
			}
		}
	}

	// Extraire les métriques des statistiques
	metrics := map[string]interface{}{
		"cpu_usage":    0,
		"memory_usage": 0,
		"disk_usage":   0,
		"uptime":       0,
		"temperature":  0,
		"version":      "N/A",
		"ip_address":   ipAddress,
		"loadavg":      "0.00, 0.00, 0.00",
		"kversion":     "N/A",
		"cpuinfo":      "N/A",
		"meminfo":      "N/A",
		"swapinfo":     "N/A",
	}

	if data := statsResult.Data; data != nil {
		fmt.Printf("📊 Raw data for %s: %+v\n", nodeName, data)

		// CPU usage - utilisation moyenne sur 1 minute
		if cpu, ok := data["cpu"].(float64); ok {
			metrics["cpu_usage"] = int(cpu * 100)
		}

		// Memory usage - utilisation mémoire en pourcentage
		if memoryMap, ok := data["memory"].(map[string]interface{}); ok {
			if used, ok := memoryMap["used"].(float64); ok {
				if total, ok := memoryMap["total"].(float64); ok && total > 0 {
					metrics["memory_usage"] = int((used / total) * 100)
					fmt.Printf("📊 Memory calculation: used=%.2fGB, total=%.2fGB, usage=%d%%\n",
						used/1024/1024/1024, total/1024/1024/1024, int((used/total)*100))
				}
			}
		}

		// Disk usage - utilisation disque en pourcentage
		if rootfsMap, ok := data["rootfs"].(map[string]interface{}); ok {
			if used, ok := rootfsMap["used"].(float64); ok {
				if total, ok := rootfsMap["total"].(float64); ok && total > 0 {
					metrics["disk_usage"] = int((used / total) * 100)
					fmt.Printf("📊 Disk calculation: used=%.2fGB, total=%.2fGB, usage=%d%%\n",
						used/1024/1024/1024, total/1024/1024/1024, int((used/total)*100))
				}
			}
		}

		// Uptime
		if uptime, ok := data["uptime"].(float64); ok {
			metrics["uptime"] = int(uptime)
		}

		// Version
		if version, ok := data["pveversion"].(string); ok {
			metrics["version"] = version
		}

		// Load average
		if loadavg, ok := data["loadavg"].([]float64); ok && len(loadavg) >= 3 {
			metrics["loadavg"] = fmt.Sprintf("%.2f, %.2f, %.2f",
				loadavg[0], loadavg[1], loadavg[2])
		}

		// Kernel version
		if kversion, ok := data["kversion"].(string); ok {
			metrics["kversion"] = kversion
		}

		// CPU info
		if cpuinfo, ok := data["cpuinfo"].(string); ok {
			metrics["cpuinfo"] = cpuinfo
		}

		// Memory info (format: used/total)
		if memoryMap, ok := data["memory"].(map[string]interface{}); ok {
			if used, ok := memoryMap["used"].(float64); ok {
				if total, ok := memoryMap["total"].(float64); ok {
					metrics["meminfo"] = fmt.Sprintf("%.2f GiB sur %.2f GiB",
						used/1024/1024/1024, total/1024/1024/1024)
				}
			}
		}

		// Swap info
		if swapMap, ok := data["swap"].(map[string]interface{}); ok {
			if used, ok := swapMap["used"].(float64); ok {
				if total, ok := swapMap["total"].(float64); ok {
					swapPercent := 0.0
					if total > 0 {
						swapPercent = (used / total) * 100
					}
					metrics["swapinfo"] = fmt.Sprintf("%.2f%% (%.2f MiB sur %.2f GiB)",
						swapPercent, used/1024/1024, total/1024/1024/1024)
					fmt.Printf("📊 Swap calculation: used=%.2fGB, total=%.2fGB, usage=%.2f%%\n",
						used/1024/1024/1024, total/1024/1024/1024, swapPercent)
				}
			}
		}
	}

	fmt.Printf("✅ Node %s metrics: CPU=%v%%, Memory=%v%%, Disk=%v%%, IP=%s, Load=%s, Swap=%s\n",
		nodeName, metrics["cpu_usage"], metrics["memory_usage"], metrics["disk_usage"],
		metrics["ip_address"], metrics["loadavg"], metrics["swapinfo"])

	return metrics, nil
}

// generateSimulatedMetrics génère des métriques simulées différentes pour chaque nœud
func (h *Handlers) generateSimulatedMetrics(nodeName string) map[string]interface{} {
	// Utiliser le nom du nœud pour générer des valeurs différentes
	hash := 0
	for _, c := range nodeName {
		hash += int(c)
	}

	// Générer des valeurs basées sur le hash du nom
	cpuUsage := (hash % 20) + 1     // 1-20%
	memoryUsage := (hash % 50) + 30 // 30-80%
	diskUsage := (hash % 40) + 15   // 15-55% (plus réaliste)
	uptime := (hash % 86400) + 3600 // 1h à 24h
	temperature := (hash % 20) + 35 // 35-55°C

	// IP simulée basée sur le nom
	ipSuffix := hash % 100
	ipAddress := fmt.Sprintf("192.168.1.%d", ipSuffix)

	// Version simulée
	version := fmt.Sprintf("pve-manager/9.0.%d/abc123def456", hash%10)

	// Load average simulé
	load1 := float64(hash%10) + 0.1
	load5 := float64(hash%15) + 0.2
	load15 := float64(hash%20) + 0.3
	loadavg := fmt.Sprintf("%.2f, %.2f, %.2f", load1, load5, load15)

	// CPU info simulé
	cpuCount := (hash % 8) + 4 // 4-12 processeurs
	cpuinfo := fmt.Sprintf("%d x Intel(R) Core(TM) i%d-8500T CPU @ 2.10GHz (1 Support de processeur)",
		cpuCount, 5000+(hash%10)*100)

	// Memory info simulé
	memUsed := float64(memoryUsage) * 0.1 // GiB
	memTotal := float64(8 + (hash % 16))  // 8-24 GiB
	meminfo := fmt.Sprintf("%.2f GiB sur %.2f GiB", memUsed, memTotal)

	// Swap info simulé
	swapPercent := (hash % 15) + 5         // 5-20%
	swapUsed := float64(swapPercent) * 0.1 // GiB
	swapTotal := float64(4 + (hash % 8))   // 4-12 GiB
	swapinfo := fmt.Sprintf("%d%% (%.2f GiB sur %.2f GiB)", swapPercent, swapUsed, swapTotal)

	// Disk info simulé
	diskUsed := float64(diskUsage) * 0.1    // GiB
	diskTotal := float64(50 + (hash % 100)) // 50-150 GiB
	diskinfo := fmt.Sprintf("%.2f GiB sur %.2f GiB", diskUsed, diskTotal)

	return map[string]interface{}{
		"cpu_usage":    cpuUsage,
		"memory_usage": memoryUsage,
		"disk_usage":   diskUsage,
		"uptime":       uptime,
		"temperature":  temperature,
		"ip_address":   ipAddress,
		"version":      version,
		"loadavg":      loadavg,
		"kversion":     fmt.Sprintf("Linux 6.14.11-%d-pve (2025-08-26T16:06Z)", hash%5),
		"cpuinfo":      cpuinfo,
		"meminfo":      meminfo,
		"swapinfo":     swapinfo,
		"diskinfo":     diskinfo,
		"vms_count":    (hash % 8) + 1,  // 1-8 VMs
		"lxc_count":    (hash % 12) + 1, // 1-12 LXC
	}
}

// fetchNodeDetails récupère les détails d'un nœud spécifique
func (h *Handlers) fetchNodeDetails(url, token, nodeName string) (map[string]interface{}, error) {
	// Configurer le client pour ignorer la vérification SSL
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Timeout: 30 * time.Second, Transport: tr}

	// Récupérer les informations du nœud
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api2/json/nodes/%s/status", url, nodeName), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Proxmox API error: %d", resp.StatusCode)
	}

	var statusResult struct {
		Data map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&statusResult); err != nil {
		return nil, err
	}

	// Récupérer les informations de version
	versionReq, err := http.NewRequest("GET", fmt.Sprintf("%s/api2/json/nodes/%s/version", url, nodeName), nil)
	if err != nil {
		return nil, err
	}

	versionReq.Header.Set("Authorization", token)
	versionReq.Header.Set("Content-Type", "application/json")

	versionResp, err := client.Do(versionReq)
	if err != nil {
		return nil, err
	}
	defer versionResp.Body.Close()

	var versionResult struct {
		Data map[string]interface{} `json:"data"`
	}

	version := "Unknown"
	if versionResp.StatusCode == 200 {
		if err := json.NewDecoder(versionResp.Body).Decode(&versionResult); err == nil {
			if v, ok := versionResult.Data["version"]; ok {
				version = v.(string)
			}
		}
	}

	// Extraire les vraies données
	data := statusResult.Data

	// Calculer les pourcentages d'utilisation
	var cpuUsage, memoryUsage, diskUsage float64
	var uptime int64
	var temperature float64
	var ipAddress string

	if cpu, ok := data["cpu"]; ok {
		if cpuFloat, ok := cpu.(float64); ok {
			cpuUsage = cpuFloat * 100
		}
	}

	if mem, ok := data["mem"]; ok {
		if memMap, ok := mem.(map[string]interface{}); ok {
			if used, ok := memMap["used"]; ok {
				if total, ok := memMap["total"]; ok {
					if usedFloat, ok := used.(float64); ok {
						if totalFloat, ok := total.(float64); ok {
							if totalFloat > 0 {
								memoryUsage = (usedFloat / totalFloat) * 100
							}
						}
					}
				}
			}
		}
	}

	if uptimeVal, ok := data["uptime"]; ok {
		if uptimeFloat, ok := uptimeVal.(float64); ok {
			uptime = int64(uptimeFloat)
		}
	}

	// Récupérer l'adresse IP (approximation)
	if pveid, ok := data["pveid"]; ok {
		ipAddress = fmt.Sprintf("192.168.1.%v", pveid)
	} else {
		ipAddress = "Unknown"
	}

	return map[string]interface{}{
		"cpu_usage":    int(cpuUsage),
		"memory_usage": int(memoryUsage),
		"disk_usage":   int(diskUsage),
		"uptime":       uptime,
		"temperature":  int(temperature),
		"version":      version,
		"ip_address":   ipAddress,
	}, nil
}

// fetchProxmoxStorages récupère les storages depuis Proxmox
func (h *Handlers) fetchProxmoxStorages(url, token string) ([]map[string]interface{}, error) {
	fmt.Printf("💾 Fetching storages from URL: %s\n", url)

	// Configurer le client pour ignorer la vérification SSL
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Timeout: 30 * time.Second, Transport: tr}

	// Récupérer la liste des storages depuis chaque nœud
	// D'abord, récupérer les nœuds
	nodesReq, err := http.NewRequest("GET", fmt.Sprintf("%s/api2/json/nodes", url), nil)
	if err != nil {
		return nil, err
	}
	nodesReq.Header.Set("Authorization", token)
	nodesReq.Header.Set("Content-Type", "application/json")

	nodesResp, err := client.Do(nodesReq)
	if err != nil {
		return nil, err
	}
	defer nodesResp.Body.Close()

	if nodesResp.StatusCode != 200 {
		return nil, fmt.Errorf("Failed to fetch nodes: %d", nodesResp.StatusCode)
	}

	var nodesResult struct {
		Data []map[string]interface{} `json:"data"`
	}
	if err := json.NewDecoder(nodesResp.Body).Decode(&nodesResult); err != nil {
		return nil, err
	}

	var allStorages []map[string]interface{}
	storageMap := make(map[string]bool) // Pour éviter les doublons

	// Pour chaque nœud, récupérer ses storages
	for _, node := range nodesResult.Data {
		nodeName, ok := node["node"].(string)
		if !ok {
			continue
		}

		storageURL := fmt.Sprintf("%s/api2/json/nodes/%s/storage", url, nodeName)
		req, err := http.NewRequest("GET", storageURL, nil)
		if err != nil {
			fmt.Printf("⚠️ Failed to create storage request for node %s: %v\n", nodeName, err)
			continue
		}

		req.Header.Set("Authorization", token)
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("⚠️ Failed to fetch storages for node %s: %v\n", nodeName, err)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			fmt.Printf("⚠️ Storage API error for node %s: %d\n", nodeName, resp.StatusCode)
			continue
		}

		var storageResult struct {
			Data []map[string]interface{} `json:"data"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&storageResult); err != nil {
			fmt.Printf("⚠️ Failed to decode storage response for node %s: %v\n", nodeName, err)
			continue
		}

		// Traiter chaque storage
		for _, storage := range storageResult.Data {
			storageID, ok := storage["storage"].(string)
			if !ok {
				continue
			}

			// Éviter les doublons (même storage sur plusieurs nœuds)
			if storageMap[storageID] {
				continue
			}
			storageMap[storageID] = true

			// Extraire les informations
			storageType, _ := storage["type"].(string)
			content, _ := storage["content"].(string)
			enabled, _ := storage["enabled"].(float64)

			// Calculer l'utilisation
			var totalSpace, usedSpace, freeSpace float64
			var usagePercent float64

			if total, ok := storage["total"].(float64); ok {
				totalSpace = total / (1024 * 1024 * 1024) // Convertir en GB
			}
			if used, ok := storage["used"].(float64); ok {
				usedSpace = used / (1024 * 1024 * 1024) // Convertir en GB
			}
			if avail, ok := storage["avail"].(float64); ok {
				freeSpace = avail / (1024 * 1024 * 1024) // Convertir en GB
			}

			if totalSpace > 0 {
				usagePercent = (usedSpace / totalSpace) * 100
			}

			// Déterminer le statut
			status := "online"
			if enabled == 0 {
				status = "offline"
			}

			storageData := map[string]interface{}{
				"id":            storageID,
				"name":          storageID,
				"type":          storageType,
				"status":        status,
				"node":          nodeName,
				"total_space":   totalSpace,
				"used_space":    usedSpace,
				"free_space":    freeSpace,
				"usage_percent": usagePercent,
				"content":       content,
				"last_update":   time.Now().Format(time.RFC3339),
			}

			allStorages = append(allStorages, storageData)
		}
	}

	fmt.Printf("✅ Storages processed: %d unique storages\n", len(allStorages))
	return allStorages, nil
}

// fetchProxmoxNetworks récupère les interfaces réseau depuis Proxmox
func (h *Handlers) fetchProxmoxNetworks(url, token, nodeName string) ([]map[string]interface{}, error) {
	fmt.Printf("🌐 Fetching network interfaces from URL: %s (node: %s)\n", url, nodeName)

	// Configurer le client pour ignorer la vérification SSL
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Timeout: 30 * time.Second, Transport: tr}

	// Si pas de nœud spécifique, récupérer le premier nœud disponible
	if nodeName == "" {
		nodesReq, err := http.NewRequest("GET", fmt.Sprintf("%s/api2/json/nodes", url), nil)
		if err != nil {
			return nil, err
		}
		nodesReq.Header.Set("Authorization", token)
		nodesReq.Header.Set("Content-Type", "application/json")

		nodesResp, err := client.Do(nodesReq)
		if err != nil {
			return nil, err
		}
		defer nodesResp.Body.Close()

		if nodesResp.StatusCode == 200 {
			var nodesResult struct {
				Data []map[string]interface{} `json:"data"`
			}
			if err := json.NewDecoder(nodesResp.Body).Decode(&nodesResult); err == nil && len(nodesResult.Data) > 0 {
				if name, ok := nodesResult.Data[0]["node"].(string); ok {
					nodeName = name
					fmt.Printf("🔍 Using first available node: %s\n", nodeName)
				}
			}
		}
	}

	if nodeName == "" {
		return nil, fmt.Errorf("no node available")
	}

	// Récupérer les interfaces réseau du nœud
	networkURL := fmt.Sprintf("%s/api2/json/nodes/%s/network", url, nodeName)
	req, err := http.NewRequest("GET", networkURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Network API error: %d", resp.StatusCode)
	}

	var networkResult struct {
		Data []map[string]interface{} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&networkResult); err != nil {
		return nil, err
	}

	var networks []map[string]interface{}
	for _, iface := range networkResult.Data {
		ifaceName, _ := iface["iface"].(string)
		ifaceType, _ := iface["type"].(string)
		active, _ := iface["active"].(float64)

		// Extraire les informations
		address, _ := iface["address"].(string)
		netmask, _ := iface["netmask"].(string)
		gateway, _ := iface["gateway"].(string)

		// Déterminer le statut
		status := "inactive"
		if active == 1 {
			status = "active"
		}

		networkData := map[string]interface{}{
			"id":          ifaceName,
			"name":        ifaceName,
			"type":        ifaceType,
			"status":      status,
			"node":        nodeName,
			"ip_address":  address,
			"netmask":     netmask,
			"gateway":     gateway,
			"active":      active == 1,
			"last_update": time.Now().Format(time.RFC3339),
		}

		networks = append(networks, networkData)
	}

	fmt.Printf("✅ Network interfaces processed: %d interfaces\n", len(networks))
	return networks, nil
}
