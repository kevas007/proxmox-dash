package services

import (
	"fmt"
	"time"

	"proxmox-dashboard/internal/models"
	"proxmox-dashboard/internal/store"
)

// AppService gère la logique métier des applications
type AppService struct {
	store *store.Store
}

// NewAppService crée une nouvelle instance d'AppService
func NewAppService(store *store.Store) *AppService {
	return &AppService{store: store}
}

// CreateApp crée une nouvelle application
func (s *AppService) CreateApp(req models.CreateAppRequest) (*models.App, error) {
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
		return nil, fmt.Errorf("validation error: %w", err)
	}

	if err := s.store.CreateApp(app); err != nil {
		return nil, fmt.Errorf("failed to create app: %w", err)
	}

	return app, nil
}

// GetApp récupère une application par ID
func (s *AppService) GetApp(id int) (*models.App, error) {
	return s.store.GetApp(id)
}

// GetApps récupère toutes les applications
func (s *AppService) GetApps() ([]*models.App, error) {
	return s.store.GetApps()
}

// UpdateApp met à jour une application
func (s *AppService) UpdateApp(id int, req models.CreateAppRequest) error {
	if err := s.store.UpdateApp(id, req); err != nil {
		return fmt.Errorf("failed to update app: %w", err)
	}
	return nil
}

// DeleteApp supprime une application
func (s *AppService) DeleteApp(id int) error {
	if err := s.store.DeleteApp(id); err != nil {
		return fmt.Errorf("failed to delete app: %w", err)
	}
	return nil
}

// CheckHealth vérifie la santé d'une application
func (s *AppService) CheckHealth(app *models.App) (*models.HealthStatus, error) {
	// Simuler une vérification de santé
	status := &models.HealthStatus{
		AppID:      app.ID,
		Status:     "online",
		Latency:    int64Ptr(100),
		LastCheck:  time.Now(),
		StatusCode: intPtr(200),
	}

	return status, nil
}

// int64Ptr retourne un pointeur vers un int64
func int64Ptr(i int64) *int64 {
	return &i
}

// intPtr retourne un pointeur vers un int
func intPtr(i int) *int {
	return &i
}
