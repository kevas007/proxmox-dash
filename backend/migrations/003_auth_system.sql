-- Migration pour le système d'authentification

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT UNIQUE NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'user',
  active       INTEGER DEFAULT 1,
  last_login   TEXT NULL,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

-- Table des sessions utilisateur
CREATE TABLE IF NOT EXISTS user_sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- Créer l'utilisateur admin par défaut (mot de passe: admin123)
-- Hash bcrypt pour "admin123": $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT OR IGNORE INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@proxmoxdash.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Créer un utilisateur de démonstration (mot de passe: demo123)
-- Hash bcrypt pour "demo123": $2a$10$N9qo8uLOickgx2ZMRZoMye1VdLSnqq3LvMcvsrbqx6.P.UhZrKWe6
INSERT OR IGNORE INTO users (username, email, password_hash, role)
VALUES ('demo', 'demo@proxmoxdash.local', '$2a$10$N9qo8uLOickgx2ZMRZoMye1VdLSnqq3LvMcvsrbqx6.P.UhZrKWe6', 'user');

-- Créer un utilisateur viewer (mot de passe: viewer123)
-- Hash bcrypt pour "viewer123": $2a$10$E4OO5yamGAAhzxhXSBp.8eJ/Ta6qxz6FjjGo8XfcMmsv/PU8Y3O/m
INSERT OR IGNORE INTO users (username, email, password_hash, role)
VALUES ('viewer', 'viewer@proxmoxdash.local', '$2a$10$E4OO5yamGAAhzxhXSBp.8eJ/Ta6qxz6FjjGo8XfcMmsv/PU8Y3O/m', 'viewer');
