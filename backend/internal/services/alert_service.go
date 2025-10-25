package services

import (
	"fmt"
	"time"

	"proxmox-dashboard/internal/models"
	"proxmox-dashboard/internal/store"
)

// AlertService gère la logique métier des alertes
type AlertService struct {
	store *store.Store
}

// NewAlertService crée une nouvelle instance d'AlertService
func NewAlertService(store *store.Store) *AlertService {
	return &AlertService{store: store}
}

// CreateAlert crée une nouvelle alerte
func (s *AlertService) CreateAlert(req models.CreateAlertRequest) (*models.Alert, error) {
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
		return nil, fmt.Errorf("validation error: %w", err)
	}

	if err := s.store.CreateAlert(alert); err != nil {
		return nil, fmt.Errorf("failed to create alert: %w", err)
	}

	return alert, nil
}

// GetAlerts récupère toutes les alertes
func (s *AlertService) GetAlerts() ([]*models.Alert, error) {
	return s.store.GetAlerts()
}

// AcknowledgeAlert marque une alerte comme acquittée
func (s *AlertService) AcknowledgeAlert(id int) error {
	// Dans une vraie implémentation, on mettrait à jour le statut
	// Pour l'instant, on simule juste
	return nil
}

// GetAlertsBySeverity récupère les alertes par niveau de sévérité
func (s *AlertService) GetAlertsBySeverity(severity string) ([]*models.Alert, error) {
	alerts, err := s.store.GetAlerts()
	if err != nil {
		return nil, err
	}

	var filtered []*models.Alert
	for _, alert := range alerts {
		if alert.Severity == severity {
			filtered = append(filtered, alert)
		}
	}

	return filtered, nil
}
