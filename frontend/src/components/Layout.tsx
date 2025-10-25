import React, { useState } from 'react';
import {
  Server,
  Monitor,
  Container,
  Database,
  HardDrive,
  Network,
  Archive,
  FileText,
  Settings,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Activity,
  Lock,
  LogOut,
  Users,
  User,
  Shield
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useAuth, hasRole } from '@/utils/auth';
import { LoginModal } from './LoginModal';

interface LayoutProps {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
  alertCount?: number;
  onToggleTheme: () => void;
  isDark: boolean;
}

const sections = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
  { id: 'nodes', label: 'Nœuds', icon: Server },
  { id: 'vms', label: 'VMs', icon: Monitor },
  { id: 'lxc', label: 'LXC', icon: Container },
  { id: 'docker', label: 'Docker', icon: Container },
  { id: 'apps', label: 'Applications', icon: Activity },
  { id: 'databases', label: 'Bases de données', icon: Database },
  { id: 'storage', label: 'Stockage', icon: HardDrive },
  { id: 'network', label: 'Réseau', icon: Network },
  { id: 'backups', label: 'Sauvegardes', icon: Archive },
  { id: 'tasks', label: 'Tâches & Logs', icon: FileText },
  { id: 'users', label: 'Utilisateurs', icon: Users, adminOnly: true },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export function Layout({
  children,
  currentSection,
  onSectionChange,
  alertCount = 0,
  onToggleTheme,
  isDark
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo et menu mobile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/nexboard-logo.png"
                  alt="NexBoard Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                NexBoard
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Sélecteur de cluster (placeholder) */}
            <select className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100">
              <option>Cluster Principal</option>
            </select>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              {alertCount > 0 && (
                <Badge
                  variant="error"
                  size="sm"
                  className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center text-xs"
                >
                  {alertCount > 99 ? '99+' : alertCount}
                </Badge>
              )}
            </button>

            {/* Toggle theme */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* Authentification */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user.username}
                  </span>
                  <Badge
                    variant={user.role === 'admin' ? 'error' : user.role === 'user' ? 'info' : 'default'}
                    size="sm"
                  >
                    {user.role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="p-2"
                  title="Se déconnecter"
                >
                  <LogOut className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLoginModal(true)}
                className="p-2"
                title="Se connecter"
              >
                <Lock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex flex-col h-full pt-16 lg:pt-0">
            {/* Indicateur d'authentification */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isAuthenticated ? 'bg-green-500' : 'bg-slate-400'
                )} />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {isAuthenticated ? 'Authentifié' : 'Lecture seule'}
                </span>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = currentSection === section.id;

                // Vérifier les permissions pour les sections admin
                if (section.adminOnly && !hasRole(user, 'admin')) {
                  return null;
                }

                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      onSectionChange(section.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center space-x-3 px-3 py-2 rounded-2xl text-left transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{section.label}</span>
                    {section.adminOnly && (
                      <Shield className="h-3 w-3 text-slate-400 ml-auto" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay pour mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Contenu principal */}
        <main className="flex-1 lg:ml-0">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Modal de connexion */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
