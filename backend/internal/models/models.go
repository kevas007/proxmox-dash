package models

import (
	"time"
)

// App représente une application monitorée
type App struct {
	ID         int       `json:"id" db:"id"`
	Name       string    `json:"name" db:"name"`
	Protocol   string    `json:"protocol" db:"protocol"`
	Host       string    `json:"host" db:"host"`
	Port       int       `json:"port" db:"port"`
	Path       string    `json:"path" db:"path"`
	Tag        *string   `json:"tag" db:"tag"`
	Icon       *string   `json:"icon" db:"icon"`
	HealthPath string    `json:"health_path" db:"health_path"`
	HealthType string    `json:"health_type" db:"health_type"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// Alert représente une alerte système
type Alert struct {
	ID           int       `json:"id" db:"id"`
	Source       string    `json:"source" db:"source"`
	Severity     string    `json:"severity" db:"severity"`
	Title        string    `json:"title" db:"title"`
	Message      string    `json:"message" db:"message"`
	Payload      *string   `json:"payload" db:"payload"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	Acknowledged bool      `json:"acknowledged" db:"acknowledged"`
}

// NotifySubscription représente un abonnement aux notifications
type NotifySubscription struct {
	ID        int       `json:"id" db:"id"`
	Channel   string    `json:"channel" db:"channel"`
	Endpoint  string    `json:"endpoint" db:"endpoint"`
	Enabled   bool      `json:"enabled" db:"enabled"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// EmailQueue représente un email en file d'attente
type EmailQueue struct {
	ID        int        `json:"id" db:"id"`
	ToAddr    string     `json:"to_addr" db:"to_addr"`
	Subject   string     `json:"subject" db:"subject"`
	BodyText  string     `json:"body_text" db:"body_text"`
	State     string     `json:"state" db:"state"`
	LastError *string    `json:"last_error" db:"last_error"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	SentAt    *time.Time `json:"sent_at" db:"sent_at"`
}

// HealthStatus représente le statut de santé d'une app
type HealthStatus struct {
	AppID      int       `json:"app_id"`
	Status     string    `json:"status"`  // online|offline|unknown
	Latency    *int64    `json:"latency"` // en millisecondes
	LastCheck  time.Time `json:"last_check"`
	StatusCode *int      `json:"status_code,omitempty"`
	Error      *string   `json:"error,omitempty"`
}

// CreateAppRequest représente une requête de création d'app
type CreateAppRequest struct {
	Name       string  `json:"name"`
	Protocol   string  `json:"protocol"`
	Host       string  `json:"host"`
	Port       int     `json:"port"`
	Path       string  `json:"path"`
	Tag        *string `json:"tag"`
	Icon       *string `json:"icon"`
	HealthPath string  `json:"health_path"`
	HealthType string  `json:"health_type"`
}

// CreateAlertRequest représente une requête de création d'alerte
type CreateAlertRequest struct {
	Source   string  `json:"source"`
	Severity string  `json:"severity"`
	Title    string  `json:"title"`
	Message  string  `json:"message"`
	Payload  *string `json:"payload"`
}

// NotifyTestRequest représente une requête de test de notification
type NotifyTestRequest struct {
	To string `json:"to"`
}

// SubscribeRequest représente une requête d'abonnement
type SubscribeRequest struct {
	Channel  string `json:"channel"`
	Endpoint string `json:"endpoint"`
}

// SSEEvent représente un événement Server-Sent Events
type SSEEvent struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}
