package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"proxmox-dashboard/internal/models"

	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
}

// New crée une nouvelle instance du store
func New(dbPath string) (*Store, error) {
	// Créer le répertoire si nécessaire
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configuration SQLite
	if _, err := db.Exec(`
		PRAGMA foreign_keys = ON;
		PRAGMA journal_mode = WAL;
		PRAGMA synchronous = NORMAL;
		PRAGMA cache_size = 1000;
		PRAGMA temp_store = memory;
	`); err != nil {
		return nil, fmt.Errorf("failed to configure database: %w", err)
	}

	store := &Store{db: db}

	// Exécuter les migrations
	if err := store.runMigrations(); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return store, nil
}

// Close ferme la connexion à la base de données
func (s *Store) Close() error {
	return s.db.Close()
}

// DB retourne la connexion à la base de données
func (s *Store) DB() *sql.DB {
	return s.db
}

// runMigrations exécute les migrations dans l'ordre
func (s *Store) runMigrations() error {
	// Créer la table de migrations
	if _, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TEXT DEFAULT (datetime('now'))
		)
	`); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Lire les fichiers de migration
	migrationsDir := "migrations"
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var migrations []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			migrations = append(migrations, entry.Name())
		}
	}
	sort.Strings(migrations)

	// Appliquer chaque migration
	for _, migration := range migrations {
		version := strings.TrimSuffix(migration, ".sql")

		// Vérifier si déjà appliquée
		var count int
		err := s.db.QueryRow("SELECT COUNT(*) FROM schema_migrations WHERE version = ?", version).Scan(&count)
		if err != nil {
			return fmt.Errorf("failed to check migration status: %w", err)
		}

		if count > 0 {
			continue // Déjà appliquée
		}

		// Lire et exécuter la migration
		content, err := os.ReadFile(filepath.Join(migrationsDir, migration))
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", migration, err)
		}

		if _, err := s.db.Exec(string(content)); err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", migration, err)
		}

		// Marquer comme appliquée
		if _, err := s.db.Exec("INSERT INTO schema_migrations (version) VALUES (?)", version); err != nil {
			return fmt.Errorf("failed to record migration %s: %w", migration, err)
		}

		fmt.Printf("Applied migration: %s\n", migration)
	}

	return nil
}

// Apps CRUD

func (s *Store) ListApps() ([]models.App, error) {
	rows, err := s.db.Query(`
		SELECT id, name, protocol, host, port, path, tag, icon, health_path, health_type, created_at
		FROM apps ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []models.App
	for rows.Next() {
		var app models.App
		var createdAt string
		err := rows.Scan(&app.ID, &app.Name, &app.Protocol, &app.Host, &app.Port,
			&app.Path, &app.Tag, &app.Icon, &app.HealthPath, &app.HealthType, &createdAt)
		if err != nil {
			return nil, err
		}

		app.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		apps = append(apps, app)
	}

	return apps, rows.Err()
}

func (s *Store) GetApp(id int) (*models.App, error) {
	var app models.App
	var createdAt string

	err := s.db.QueryRow(`
		SELECT id, name, protocol, host, port, path, tag, icon, health_path, health_type, created_at
		FROM apps WHERE id = ?
	`, id).Scan(&app.ID, &app.Name, &app.Protocol, &app.Host, &app.Port,
		&app.Path, &app.Tag, &app.Icon, &app.HealthPath, &app.HealthType, &createdAt)

	if err != nil {
		return nil, err
	}

	app.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	return &app, nil
}

func (s *Store) CreateApp(req models.CreateAppRequest) (*models.App, error) {
	result, err := s.db.Exec(`
		INSERT INTO apps (name, protocol, host, port, path, tag, icon, health_path, health_type)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, req.Name, req.Protocol, req.Host, req.Port, req.Path, req.Tag, req.Icon, req.HealthPath, req.HealthType)

	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return s.GetApp(int(id))
}

func (s *Store) UpdateApp(id int, req models.CreateAppRequest) (*models.App, error) {
	_, err := s.db.Exec(`
		UPDATE apps SET name = ?, protocol = ?, host = ?, port = ?, path = ?,
		tag = ?, icon = ?, health_path = ?, health_type = ?
		WHERE id = ?
	`, req.Name, req.Protocol, req.Host, req.Port, req.Path, req.Tag, req.Icon,
		req.HealthPath, req.HealthType, id)

	if err != nil {
		return nil, err
	}

	return s.GetApp(id)
}

func (s *Store) DeleteApp(id int) error {
	_, err := s.db.Exec("DELETE FROM apps WHERE id = ?", id)
	return err
}

// Alerts CRUD

func (s *Store) ListAlerts(limit int) ([]models.Alert, error) {
	query := `
		SELECT id, source, severity, title, message, payload, created_at, acknowledged
		FROM alerts ORDER BY created_at DESC
	`
	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", limit)
	}

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var alert models.Alert
		var createdAt string
		var acknowledged int

		err := rows.Scan(&alert.ID, &alert.Source, &alert.Severity, &alert.Title,
			&alert.Message, &alert.Payload, &createdAt, &acknowledged)
		if err != nil {
			return nil, err
		}

		alert.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		alert.Acknowledged = acknowledged == 1
		alerts = append(alerts, alert)
	}

	return alerts, rows.Err()
}

func (s *Store) CreateAlert(req models.CreateAlertRequest) (*models.Alert, error) {
	result, err := s.db.Exec(`
		INSERT INTO alerts (source, severity, title, message, payload)
		VALUES (?, ?, ?, ?, ?)
	`, req.Source, req.Severity, req.Title, req.Message, req.Payload)

	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return s.GetAlert(int(id))
}

func (s *Store) GetAlert(id int) (*models.Alert, error) {
	var alert models.Alert
	var createdAt string
	var acknowledged int

	err := s.db.QueryRow(`
		SELECT id, source, severity, title, message, payload, created_at, acknowledged
		FROM alerts WHERE id = ?
	`, id).Scan(&alert.ID, &alert.Source, &alert.Severity, &alert.Title,
		&alert.Message, &alert.Payload, &createdAt, &acknowledged)

	if err != nil {
		return nil, err
	}

	alert.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	alert.Acknowledged = acknowledged == 1
	return &alert, nil
}

func (s *Store) AckAlert(id int) error {
	_, err := s.db.Exec("UPDATE alerts SET acknowledged = 1 WHERE id = ?", id)
	return err
}

// Subscriptions

func (s *Store) AddSubscription(req models.SubscribeRequest) (*models.NotifySubscription, error) {
	result, err := s.db.Exec(`
		INSERT INTO notify_subscriptions (channel, endpoint)
		VALUES (?, ?)
	`, req.Channel, req.Endpoint)

	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return s.GetSubscription(int(id))
}

func (s *Store) GetSubscription(id int) (*models.NotifySubscription, error) {
	var sub models.NotifySubscription
	var createdAt string
	var enabled int

	err := s.db.QueryRow(`
		SELECT id, channel, endpoint, enabled, created_at
		FROM notify_subscriptions WHERE id = ?
	`, id).Scan(&sub.ID, &sub.Channel, &sub.Endpoint, &enabled, &createdAt)

	if err != nil {
		return nil, err
	}

	sub.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	sub.Enabled = enabled == 1
	return &sub, nil
}

func (s *Store) ListEmailSubscriptions() ([]models.NotifySubscription, error) {
	rows, err := s.db.Query(`
		SELECT id, channel, endpoint, enabled, created_at
		FROM notify_subscriptions WHERE channel = 'email' AND enabled = 1
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []models.NotifySubscription
	for rows.Next() {
		var sub models.NotifySubscription
		var createdAt string
		var enabled int

		err := rows.Scan(&sub.ID, &sub.Channel, &sub.Endpoint, &enabled, &createdAt)
		if err != nil {
			return nil, err
		}

		sub.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		sub.Enabled = enabled == 1
		subs = append(subs, sub)
	}

	return subs, rows.Err()
}

// Email Queue

func (s *Store) EnqueueEmail(toAddr, subject, body string) error {
	_, err := s.db.Exec(`
		INSERT INTO email_queue (to_addr, subject, body_text)
		VALUES (?, ?, ?)
	`, toAddr, subject, body)
	return err
}

func (s *Store) GetQueuedEmails() ([]models.EmailQueue, error) {
	rows, err := s.db.Query(`
		SELECT id, to_addr, subject, body_text, state, last_error, created_at, sent_at
		FROM email_queue WHERE state = 'queued' ORDER BY created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var emails []models.EmailQueue
	for rows.Next() {
		var email models.EmailQueue
		var createdAt string
		var sentAt sql.NullString

		err := rows.Scan(&email.ID, &email.ToAddr, &email.Subject, &email.BodyText,
			&email.State, &email.LastError, &createdAt, &sentAt)
		if err != nil {
			return nil, err
		}

		email.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		if sentAt.Valid {
			t, _ := time.Parse("2006-01-02 15:04:05", sentAt.String)
			email.SentAt = &t
		}
		emails = append(emails, email)
	}

	return emails, rows.Err()
}

func (s *Store) MarkEmailSent(id int) error {
	_, err := s.db.Exec(`
		UPDATE email_queue SET state = 'sent', sent_at = datetime('now') WHERE id = ?
	`, id)
	return err
}

func (s *Store) MarkEmailError(id int, errorMsg string) error {
	_, err := s.db.Exec(`
		UPDATE email_queue SET state = 'error', last_error = ? WHERE id = ?
	`, errorMsg, id)
	return err
}
